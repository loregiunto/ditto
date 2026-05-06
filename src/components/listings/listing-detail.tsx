"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Bath,
  Check,
  ChevronRight,
  Clock,
  Heart,
  Lock,
  LogIn,
  MapPin,
  Search,
  Share2,
  ShieldCheck,
  Sparkles,
  Star,
  Store,
  UserRound,
} from "lucide-react";
import type {
  PublicListingDetail,
  PublicSlot,
  PublicSlotDay,
} from "@/lib/listings/detail";
import { ReviewsList } from "./reviews-list";
import { SlotPicker } from "./slot-picker";
import styles from "./listing-detail.module.css";

type Props = {
  listing: PublicListingDetail;
  slotDays: PublicSlotDay[];
  isAuthenticated: boolean;
  signInHref: string;
};

const HOST_TYPE_LABEL: Record<PublicListingDetail["hostType"], string> = {
  PRIVATE: "Privato",
  BUSINESS: "Attivita Commerciale",
};

const BOOKING_MODE_LABEL: Record<PublicListingDetail["bookingMode"], string> = {
  INSTANT: "Conferma istantanea",
  REQUEST: "Su richiesta",
};

function formatPrice(cents: number): string {
  return (cents / 100).toFixed(2).replace(".", ",");
}

function titleWithAccent(title: string) {
  const parts = title.trim().split(/\s+/);
  if (parts.length < 2) return title;
  const last = parts.pop();
  return (
    <>
      {parts.join(" ")} <em>{last}</em>
    </>
  );
}

function hostInitial(listing: PublicListingDetail): string {
  return (listing.host.name ?? listing.title).charAt(0).toUpperCase();
}

function firstAvailableSlot(days: PublicSlotDay[]): PublicSlot | null {
  return days.flatMap((day) => day.slots)[0] ?? null;
}

export function ListingDetail({
  listing,
  slotDays,
  isAuthenticated,
  signInHref,
}: Props) {
  const router = useRouter();
  const [selectedSlot, setSelectedSlot] = useState<PublicSlot | null>(() =>
    firstAvailableSlot(slotDays),
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleBook() {
    if (!selectedSlot || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/bookings/instant/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listingId: listing.id,
          startsAt: selectedSlot.startsAt,
          endsAt: selectedSlot.endsAt,
        }),
      });
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        const code = payload?.code ?? "error";
        const messages: Record<string, string> = {
          slot_unavailable: "Lo slot non è più disponibile. Scegline un altro.",
          past_slot: "Lo slot scelto è già passato.",
          outside_rules: "Lo slot non rientra nella disponibilità dell'host.",
          bad_granularity: "Durata slot non valida.",
          not_instant: "Questo bagno non accetta prenotazioni istantanee.",
        };
        setError(messages[code] ?? "Impossibile avviare il pagamento.");
        if (code === "slot_unavailable") {
          router.refresh();
        }
        return;
      }
      const data = (await res.json()) as { checkoutUrl: string | null };
      if (!data.checkoutUrl) {
        setError("URL di pagamento non disponibile.");
        return;
      }
      window.location.assign(data.checkoutUrl);
    } catch {
      setError("Errore di rete. Riprova.");
    } finally {
      setSubmitting(false);
    }
  }

  const selectedSlotDay = useMemo(
    () => slotDays.find((day) => day.dateKey === selectedSlot?.dateKey) ?? null,
    [selectedSlot, slotDays],
  );

  const photos = listing.photos.length
    ? listing.photos.slice(0, 5)
    : Array.from({ length: 5 }, (_, index) => ({
        id: `fallback-${index}`,
        url: "",
        order: index,
      }));

  const isInstant = listing.bookingMode === "INSTANT";
  const reviewLabel =
    listing.reviews.totalCount > 0
      ? `${listing.reviews.totalCount} recensioni`
      : "nessuna recensione";

  return (
    <div className={styles.shell}>
      <header className={styles.topnav}>
        <div className={styles.topnavInner}>
          <Link className={styles.brand} href="/">
            <span className={styles.brandMark}>h</span>
            <span className={styles.brandName}>
              Home<em>Rest</em>
            </span>
          </Link>

          <div className={styles.topnavSearch}>
            <Search aria-hidden="true" />
            <span>{listing.addressDisplay} · disponibile ora</span>
          </div>

          <div className={styles.topnavActions}>
            <Link className={styles.btnGhost} href="/host/dashboard">
              Diventa host
            </Link>
            {isAuthenticated ? (
              <Link className={styles.userPill} href="/dashboard">
                <span className={styles.avatarSmall}>M</span>
                <span>Account</span>
              </Link>
            ) : (
              <>
                <Link className={styles.btn} href={signInHref}>
                  Accedi
                </Link>
                <Link className={styles.btnPrimary} href={signInHref}>
                  Registrati
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main className={styles.page}>
        <nav className={styles.crumbs} aria-label="Breadcrumb">
          <Link href="/">Discover</Link>
          <ChevronRight aria-hidden="true" />
          <span>Roma</span>
          <ChevronRight aria-hidden="true" />
          <span>{listing.addressDisplay}</span>
          <ChevronRight aria-hidden="true" />
          <span className={styles.current}>{listing.title}</span>
        </nav>

        <div className={styles.titleBlock}>
          <div className={styles.titleMain}>
            <div className={styles.eyebrow}>
              Listing #{listing.id.slice(0, 8)} ·{" "}
              {HOST_TYPE_LABEL[listing.hostType]}
            </div>
            <h1>{titleWithAccent(listing.title)}</h1>
            <div className={styles.titleMeta}>
              {listing.reviews.averageRating ? (
                <span className={styles.rating}>
                  <Star aria-hidden="true" />
                  {listing.reviews.averageRating.toFixed(1).replace(".", ",")}
                </span>
              ) : (
                <span className={styles.newBadge}>Nuovo su HomeRest</span>
              )}
              <span className={styles.dot} />
              <a href="#location" className={styles.zone}>
                <MapPin aria-hidden="true" />
                {listing.addressDisplay}
              </a>
            </div>
          </div>
          <div className={styles.titleActions}>
            <button className={styles.btn} type="button">
              <Share2 aria-hidden="true" />
              Condividi
            </button>
            <button className={styles.btn} type="button">
              <Heart aria-hidden="true" />
              Salva
            </button>
          </div>
        </div>

        <div className={styles.gallery}>
          {photos.map((photo, index) => (
            <div
              className={`${styles.galleryTile} ${
                index === 0 ? styles.galleryHero : ""
              }`}
              key={photo.id}
            >
              {photo.url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={photo.url} alt={`${listing.title} foto ${index + 1}`} />
              ) : (
                <div className={`${styles.photoFallback} ${styles[`photo${index + 1}`]}`} />
              )}
              {index === 0 ? (
                <span className={styles.galleryPhotoNum}>
                  01 / {String(listing.photos.length || photos.length).padStart(2, "0")}
                </span>
              ) : null}
            </div>
          ))}
          <button className={styles.galleryCounter} type="button">
            <Bath aria-hidden="true" />
            Vedi tutte le {listing.photos.length || photos.length} foto
          </button>
        </div>

        <div className={styles.content}>
          <div className={styles.mainCol}>
            <div className={styles.badgesStrip}>
              <span
                className={`${styles.badgePill} ${
                  listing.hostType === "PRIVATE"
                    ? styles.badgePrivate
                    : styles.badgeBusiness
                }`}
              >
                {listing.hostType === "PRIVATE" ? (
                  <UserRound aria-hidden="true" />
                ) : (
                  <Store aria-hidden="true" />
                )}
                {HOST_TYPE_LABEL[listing.hostType]}
              </span>
              {listing.badges.verified ? (
                <span className={`${styles.badgePill} ${styles.badgeVerified}`}>
                  <ShieldCheck aria-hidden="true" />
                  Verificato
                </span>
              ) : (
                <span className={`${styles.badgePill} ${styles.badgeGhost}`}>
                  <Clock aria-hidden="true" />
                  Verifica in corso
                </span>
              )}
              {listing.badges.superHost ? (
                <span className={`${styles.badgePill} ${styles.badgeSuper}`}>
                  <Star aria-hidden="true" />
                  Super Host
                </span>
              ) : null}
              <span className={`${styles.badgePill} ${styles.badgeAmber}`}>
                <Clock aria-hidden="true" />
                {BOOKING_MODE_LABEL[listing.bookingMode]}
              </span>
            </div>

            <div className={styles.highlights}>
              <div className={styles.highlight}>
                <Clock aria-hidden="true" />
                <div>
                  <strong>Disponibilita pubblicata</strong>
                  <span>Slot da 30 minuti nei prossimi 7 giorni</span>
                </div>
              </div>
              <div className={styles.highlight}>
                <Sparkles aria-hidden="true" />
                <div>
                  <strong>Spazio curato</strong>
                  <span>Descrizione completa e foto del bagno</span>
                </div>
              </div>
              <div className={styles.highlight}>
                <Lock aria-hidden="true" />
                <div>
                  <strong>Privacy protetta</strong>
                  <span>Indirizzo esatto solo dopo la prenotazione</span>
                </div>
              </div>
            </div>

            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>
                Dettagli dello <em>spazio</em>
              </h2>
              <div className={styles.description}>
                {listing.description.split("\n").map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
            </section>

            <hr className={styles.sectionDivider} />

            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>
                Il tuo <em>host</em>
              </h2>
              <div className={styles.hostCard}>
                <div className={styles.avatarLarge}>
                  {listing.host.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={listing.host.image} alt="" />
                  ) : (
                    hostInitial(listing)
                  )}
                </div>
                <div>
                  <h3>{listing.host.name ?? "Host HomeRest"}</h3>
                  <p>
                    {HOST_TYPE_LABEL[listing.hostType]} ·{" "}
                    {listing.badges.verified
                      ? "identita verificata"
                      : "verifica identita in corso"}
                  </p>
                  <div className={styles.hostBadges}>
                    {listing.badges.verified ? (
                      <span className={`${styles.badgePill} ${styles.badgeVerified}`}>
                        <ShieldCheck aria-hidden="true" />
                        Identita verificata
                      </span>
                    ) : null}
                    <span className={styles.badgePill}>
                      {HOST_TYPE_LABEL[listing.hostType]}
                    </span>
                  </div>
                </div>
              </div>
            </section>

            <hr className={styles.sectionDivider} />

            <section className={styles.section} id="location">
              <div className={styles.locationHead}>
                <h2 className={styles.sectionTitle}>
                  Dove <em>si trova</em>
                </h2>
                <span className={styles.privacyNote}>
                  <Lock aria-hidden="true" />
                  Indirizzo esatto rivelato dopo la prenotazione
                </span>
              </div>
              <div className={styles.locationCard}>
                <div className={styles.locationMap}>
                  <span className={styles.approxCircle} />
                  <span className={styles.approxPin} />
                </div>
                <div className={styles.locationMeta}>
                  <strong>{listing.addressDisplay}</strong>
                  <span>
                    La posizione e mostrata come zona approssimativa prima della
                    prenotazione.
                  </span>
                </div>
              </div>
            </section>

            <hr className={styles.sectionDivider} />

            <SlotPicker
              days={slotDays}
              selectedSlotId={selectedSlot?.id ?? null}
              onSelect={setSelectedSlot}
            />

            <hr className={styles.sectionDivider} />

            <ReviewsList reviews={listing.reviews} />
          </div>

          <aside className={styles.sidebar}>
            <div className={styles.booking}>
              <div className={styles.bookingPrice}>
                <span>{formatPrice(listing.hourlyPriceCents)} EUR</span>
                <small>/ ora</small>
              </div>
              <div className={styles.bookingRating}>
                <Star aria-hidden="true" />
                <span>{reviewLabel}</span>
              </div>

              {!isAuthenticated ? (
                <div className={styles.authCallout}>
                  <LogIn aria-hidden="true" />
                  <div>
                    <strong>Accedi per prenotare</strong>
                    <span>Salveremo questo listing e il tuo slot selezionato.</span>
                  </div>
                </div>
              ) : null}

              <div className={styles.bookingFields}>
                <div>
                  <span>Data</span>
                  <strong>{selectedSlotDay?.dateLabel ?? "Seleziona"}</strong>
                </div>
                <div>
                  <span>Slot</span>
                  <strong>
                    {selectedSlot
                      ? `${selectedSlot.startTime} -> ${selectedSlot.endTime}`
                      : "-"}
                  </strong>
                </div>
                <div>
                  <span>Ospiti</span>
                  <strong>1 persona</strong>
                </div>
              </div>

              <div
                className={`${styles.bookingConfirm} ${
                  isInstant ? "" : styles.requestConfirm
                }`}
              >
                {isInstant ? <Check aria-hidden="true" /> : <Clock aria-hidden="true" />}
                <span>
                  <strong>
                    {isInstant ? "Conferma istantanea" : "Conferma su richiesta"}
                  </strong>{" "}
                  {isInstant
                    ? "il bagno e subito tuo dopo la conferma."
                    : "l'host dovra approvare la richiesta."}
                </span>
              </div>

              <div className={styles.bookingCta}>
                {isAuthenticated ? (
                  <button
                    className={styles.btnAccent}
                    type="button"
                    disabled={!selectedSlot || submitting}
                    onClick={handleBook}
                    data-testid="book-now-cta"
                  >
                    {submitting ? "Avvio pagamento…" : "Prenota ora"}
                    <ArrowRight aria-hidden="true" />
                  </button>
                ) : (
                  <Link className={styles.btnPrimary} href={signInHref}>
                    <LogIn aria-hidden="true" />
                    Accedi per prenotare
                  </Link>
                )}
              </div>

              {error ? (
                <div className={styles.bookingTooltip} role="alert">
                  <Lock aria-hidden="true" />
                  {error}
                </div>
              ) : isAuthenticated && isInstant ? (
                <div className={styles.bookingTooltip}>
                  <Lock aria-hidden="true" />
                  Pagamento sicuro via Stripe. L&apos;indirizzo esatto sarà
                  svelato dopo la conferma.
                </div>
              ) : null}

              <div className={styles.bookingSummary}>
                <div>
                  <span>{formatPrice(listing.hourlyPriceCents)} EUR x 1 ora</span>
                  <span>{formatPrice(listing.hourlyPriceCents)} EUR</span>
                </div>
                <div className={styles.totalRow}>
                  <span>Totale stimato</span>
                  <span>{formatPrice(listing.hourlyPriceCents)} EUR</span>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
