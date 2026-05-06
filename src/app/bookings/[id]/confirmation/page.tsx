import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/user";
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
          host: { select: { name: true } },
        },
      },
    },
  });

  if (!booking || booking.userId !== user.id) {
    notFound();
  }

  const isConfirmed = booking.status === "CONFIRMED";
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
          <span className={styles.securePill}>
            {isConfirmed
              ? "Pagamento confermato da Stripe"
              : "Pagamento in elaborazione"}
          </span>
        </div>
      </header>

      <main className={styles.page}>
        <section className={styles.headline}>
          <div className={styles.eyebrow}>
            {isConfirmed ? "Prenotazione confermata" : "Pagamento in attesa"}
          </div>
          <h1>
            {isConfirmed ? (
              <>
                Lo slot è <em>tuo</em>.
              </>
            ) : (
              <>
                Stiamo confermando il <em>tuo pagamento</em>.
              </>
            )}
          </h1>
          <p className={styles.lead}>
            {isConfirmed
              ? "Abbiamo svelato l'indirizzo esatto e avvisato l'host."
              : "Non chiudere questa pagina. Aggiorneremo lo stato non appena Stripe conferma il pagamento."}
          </p>
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
                  <h3>
                    {isConfirmed
                      ? "Indirizzo esatto"
                      : "Indirizzo protetto fino alla conferma"}
                  </h3>
                  {isConfirmed ? (
                    <p data-testid="address-full">
                      {booking.listing.addressFull}
                    </p>
                  ) : (
                    <p>
                      Mostreremo via, civico e indicazioni non appena Stripe
                      conferma il pagamento.
                    </p>
                  )}
                </div>
              </section>

              {!isConfirmed ? (
                <section className={styles.notice}>
                  <strong>Stato pagamento</strong>
                  <p>
                    La prenotazione è in stato <code>{booking.status}</code>.
                    Aggiorna la pagina tra qualche secondo se non vedi la
                    conferma.
                  </p>
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
                    Conferma istantanea
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
                <span>Totale pagato</span>
                <span className={styles.amount}>
                  EUR {formatPriceEur(booking.amountCents)}
                </span>
              </div>
            </div>

            <Link className={styles.cta} href="/dashboard">
              Vai alle tue prenotazioni
            </Link>
            <div className={styles.subnote}>
              {isConfirmed
                ? "Una ricevuta è stata inviata via email da Stripe."
                : "Non addebiteremo nulla finché non riceviamo conferma da Stripe."}
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
