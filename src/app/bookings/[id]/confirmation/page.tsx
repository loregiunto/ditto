import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/user";
import { shouldRevealAddress } from "@/lib/bookings/confirmation-policy";
import styles from "./confirmation.module.css";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ id: string }>;
};

function formatPriceEur(cents: number): string {
  return (cents / 100).toFixed(2).replace(".", ",");
}

function formatDateIt(date: Date): string {
  return new Intl.DateTimeFormat("it-IT", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(date);
}

function formatTimeIt(date: Date): string {
  return new Intl.DateTimeFormat("it-IT", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

type StatusCopy = {
  pill: string;
  eyebrow: string;
  heading: React.ReactNode;
  lead: string;
  addressTitle: string;
  addressBody: React.ReactNode;
  modeBadge: string;
  noticeStrong?: string;
  noticeBody?: string;
  subnote: string;
};

function copyForStatus(args: {
  status: string;
  addressFull: string;
  hostDecisionDeadline: Date | null;
  bookingMode: "INSTANT" | "REQUEST";
}): StatusCopy {
  const { status, addressFull, hostDecisionDeadline, bookingMode } = args;
  const isRequest = bookingMode === "REQUEST";
  const modeBadge = isRequest ? "Conferma su richiesta" : "Conferma istantanea";

  if (status === "CONFIRMED") {
    return {
      pill: "Pagamento confermato da Stripe",
      eyebrow: "Prenotazione confermata",
      heading: (
        <>
          Lo slot è <em>tuo</em>.
        </>
      ),
      lead: "Abbiamo svelato l'indirizzo esatto e avvisato l'host.",
      addressTitle: "Indirizzo esatto",
      addressBody: shouldRevealAddress(status) ? (
        <p data-testid="address-full">{addressFull}</p>
      ) : (
        <p>Indirizzo non disponibile.</p>
      ),
      modeBadge,
      subnote: "Una ricevuta è stata inviata via email da Stripe.",
    };
  }

  if (status === "PENDING_HOST_APPROVAL") {
    const deadlineText = hostDecisionDeadline
      ? `entro ${formatTimeIt(hostDecisionDeadline)}`
      : "entro 30 minuti";
    return {
      pill: "Pre-autorizzazione Stripe attiva",
      eyebrow: "Richiesta inviata · in attesa",
      heading: (
        <>
          Aspettiamo la <em>risposta dell&apos;host</em>.
        </>
      ),
      lead: `Lo slot è bloccato per te. L'host risponde ${deadlineText}; nessun addebito finché non approva.`,
      addressTitle: "Indirizzo protetto fino all'approvazione",
      addressBody: (
        <p>
          Mostreremo via, civico e indicazioni non appena l&apos;host conferma
          la richiesta.
        </p>
      ),
      modeBadge,
      noticeStrong: "Stato richiesta",
      noticeBody:
        "Se non ricevi conferma entro la finestra di 30 minuti, la pre-autorizzazione viene annullata in automatico.",
      subnote:
        "Non chiudere la pagina di pagamento: il riepilogo Stripe arriverà via email solo dopo l'approvazione.",
    };
  }

  if (status === "REJECTED") {
    return {
      pill: "Pre-autorizzazione annullata",
      eyebrow: "Richiesta rifiutata",
      heading: (
        <>
          L&apos;host non ha potuto <em>accoglierti</em>.
        </>
      ),
      lead: "Nessun addebito è stato effettuato. Lo slot è di nuovo disponibile per altri ospiti.",
      addressTitle: "Indirizzo non disponibile",
      addressBody: (
        <p>
          Per questa richiesta non riveliamo l&apos;indirizzo. Cerca un altro
          bagno disponibile nelle vicinanze.
        </p>
      ),
      modeBadge,
      noticeStrong: "Cosa succede ora",
      noticeBody:
        "Stripe rilascia la pre-autorizzazione entro pochi minuti. Non comparirà alcun addebito sul tuo estratto.",
      subnote: "Puoi cercare un altro bagno o riprovare con un altro orario.",
    };
  }

  if (status === "EXPIRED") {
    return {
      pill: "Tempo scaduto",
      eyebrow: "Richiesta scaduta",
      heading: (
        <>
          L&apos;host non ha risposto in <em>tempo</em>.
        </>
      ),
      lead: "La pre-autorizzazione è stata annullata in automatico. Nessun addebito sulla tua carta.",
      addressTitle: "Indirizzo non disponibile",
      addressBody: (
        <p>
          Senza approvazione non sveliamo l&apos;indirizzo. Lo slot è tornato
          libero per altri ospiti.
        </p>
      ),
      modeBadge,
      noticeStrong: "Cosa succede ora",
      noticeBody:
        "Cerca un altro bagno disponibile o invia una nuova richiesta su uno slot differente.",
      subnote: "Nessun addebito Stripe — la pre-autorizzazione è stata rilasciata.",
    };
  }

  // PENDING_PAYMENT or any unexpected state
  return {
    pill: "Pagamento in elaborazione",
    eyebrow: "Pagamento in attesa",
    heading: (
      <>
        Stiamo confermando il <em>tuo pagamento</em>.
      </>
    ),
    lead: "Non chiudere questa pagina. Aggiorneremo lo stato non appena Stripe conferma il pagamento.",
    addressTitle: "Indirizzo protetto fino alla conferma",
    addressBody: (
      <p>
        Mostreremo via, civico e indicazioni non appena Stripe conferma il
        pagamento.
      </p>
    ),
    modeBadge,
    noticeStrong: "Stato pagamento",
    noticeBody: `La prenotazione è in stato ${status}. Aggiorna la pagina tra qualche secondo se non vedi la conferma.`,
    subnote: "Non addebiteremo nulla finché non riceviamo conferma da Stripe.",
  };
}

export default async function BookingConfirmationPage({ params }: PageProps) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) {
    redirect(
      `/auth/signin?redirect=/bookings/${encodeURIComponent(id)}/confirmation`,
    );
  }

  const booking = await prisma.booking.findUnique({
    where: { id },
    include: {
      listing: {
        select: {
          id: true,
          title: true,
          addressFull: true,
          addressDisplay: true,
          hourlyPriceCents: true,
          bookingMode: true,
          host: { select: { name: true } },
        },
      },
    },
  });

  if (!booking || booking.userId !== user.id) {
    notFound();
  }

  const status = booking.status as string;
  const isConfirmed = status === "CONFIRMED";

  const copy = copyForStatus({
    status,
    addressFull: booking.listing.addressFull,
    hostDecisionDeadline: booking.hostDecisionDeadline,
    bookingMode: booking.listing.bookingMode,
  });

  const startsAt = booking.startsAt;
  const endsAt = booking.endsAt;

  return (
    <div className={styles.shell}>
      <header className={styles.topbar}>
        <div className={styles.topbarInner}>
          <Link className={styles.brand} href="/">
            <span className={styles.brandMark}>h</span>
            <span className={styles.brandName}>
              Home<em>Rest</em>
            </span>
          </Link>
          <span className={styles.securePill}>{copy.pill}</span>
        </div>
      </header>

      <main className={styles.page}>
        <section className={styles.headline}>
          <div
            className={styles.eyebrow}
            data-testid="confirmation-status"
            data-status={status}
          >
            {copy.eyebrow}
          </div>
          <h1>{copy.heading}</h1>
          <p className={styles.lead}>{copy.lead}</p>
        </section>

        <div className={styles.layout}>
          <section className={styles.flowCard}>
            <div className={styles.steps}>
              <div className={`${styles.step} ${styles.stepDone}`}>
                <span className={styles.stepNum}>1</span>
                <span>Slot scelto</span>
              </div>
              <div className={`${styles.step} ${styles.stepDone}`}>
                <span className={styles.stepNum}>2</span>
                <span>Pagamento</span>
              </div>
              <div
                className={`${styles.step} ${
                  isConfirmed ? styles.stepDone : styles.stepActive
                }`}
              >
                <span className={styles.stepNum}>3</span>
                <span>Conferma</span>
              </div>
            </div>

            <div className={styles.flowBody}>
              <section>
                <h2 className={styles.sectionTitle}>Quando</h2>
                <div className={styles.fieldRow}>
                  <div className={styles.field}>
                    <span className={styles.label}>Data</span>
                    <span className={styles.value}>{formatDateIt(startsAt)}</span>
                  </div>
                  <div className={styles.field}>
                    <span className={styles.label}>Orario</span>
                    <span className={styles.value}>
                      {formatTimeIt(startsAt)} → {formatTimeIt(endsAt)}
                    </span>
                  </div>
                </div>
              </section>

              <section className={styles.addressReveal} data-testid="address-block">
                <div className={styles.lock}>#</div>
                <div>
                  <h3>{copy.addressTitle}</h3>
                  {copy.addressBody}
                </div>
              </section>

              {copy.noticeStrong ? (
                <section className={styles.notice}>
                  <strong>{copy.noticeStrong}</strong>
                  <p>{copy.noticeBody}</p>
                </section>
              ) : null}
            </div>
          </section>

          <aside className={styles.summaryCard}>
            <article className={styles.listingCard}>
              <div className={styles.photo} />
              <div className={styles.listingBody}>
                <div className={styles.badges}>
                  <span className={styles.badge}>
                    {booking.listing.host.name ?? "Host HomeRest"}
                  </span>
                  <span className={`${styles.badge} ${styles.badgeSage}`}>
                    {copy.modeBadge}
                  </span>
                </div>
                <h2 className={styles.listingTitle}>{booking.listing.title}</h2>
                <div className={styles.zone}>{booking.listing.addressDisplay}</div>
              </div>
            </article>

            <div className={styles.priceLines}>
              <div className={styles.line}>
                <span>Totale prenotazione</span>
                <span>EUR {formatPriceEur(booking.amountCents)}</span>
              </div>
              <div className={styles.line}>
                <span>Commissione piattaforma (10%)</span>
                <span>EUR {formatPriceEur(booking.platformFeeCents)}</span>
              </div>
              <div className={styles.line}>
                <span>Ricevuta Stripe</span>
                <span>{user.email}</span>
              </div>
              <div className={`${styles.line} ${styles.lineTotal}`}>
                <span>
                  {isConfirmed ? "Totale pagato" : "Pre-autorizzazione"}
                </span>
                <span className={styles.amount}>
                  EUR {formatPriceEur(booking.amountCents)}
                </span>
              </div>
            </div>

            <Link className={styles.cta} href="/dashboard">
              Vai alle tue prenotazioni
            </Link>
            <div className={styles.subnote}>{copy.subnote}</div>
          </aside>
        </div>
      </main>
    </div>
  );
}
