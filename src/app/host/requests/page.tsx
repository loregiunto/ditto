import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/user";
import { prisma } from "@/lib/prisma";
import { expireStaleRequests } from "@/lib/bookings/expiration";
import {
  DsTopnav,
  DsDisplayTitle,
  DsBadge,
  DsEmptyState,
  DsLinkButton,
} from "@/components/design-system";
import {
  approveBookingAction,
  rejectBookingAction,
} from "./actions";

export const dynamic = "force-dynamic";

function formatPriceEur(cents: number): string {
  return (cents / 100).toFixed(2).replace(".", ",");
}

function formatDateTimeIt(date: Date): string {
  return new Intl.DateTimeFormat("it-IT", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function formatCountdown(deadline: Date, now: Date): string {
  const ms = deadline.getTime() - now.getTime();
  if (ms <= 0) return "scaduta";
  const totalMin = Math.ceil(ms / 60_000);
  if (totalMin >= 60) {
    const h = Math.floor(totalMin / 60);
    const m = totalMin % 60;
    return `${h}h ${m}m`;
  }
  return `${totalMin} min`;
}

export default async function HostRequestsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/signin?redirect=/host/requests");

  // Lazy expire on every render so the inbox is always honest, even without cron.
  try {
    await expireStaleRequests();
  } catch (err) {
    console.error("[host-requests] expire failed", err);
  }

  const now = new Date();
  const requests = await prisma.booking.findMany({
    where: {
      status: "PENDING_HOST_APPROVAL",
      listing: { hostId: user.id },
    },
    orderBy: { hostDecisionDeadline: "asc" },
    include: {
      listing: {
        select: {
          id: true,
          title: true,
          addressDisplay: true,
          photos: { orderBy: { order: "asc" }, take: 1, select: { url: true } },
        },
      },
      user: { select: { name: true, email: true } },
    },
  });

  return (
    <div className="ds-surface">
      <DsTopnav
        rightSlot={
          <DsLinkButton href="/host/dashboard" variant="ghost" size="sm">
            Dashboard
          </DsLinkButton>
        }
      />

      <main className="ds-page">
        <section className="ds-title-block">
          <DsDisplayTitle
            eyebrow="Inbox host"
            text="Richieste in attesa"
            subtitle="Hai 30 minuti per rispondere a ogni richiesta. Lo slot è bloccato per il guest finché non decidi."
          />
        </section>

        {requests.length === 0 ? (
          <DsEmptyState
            icon={
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.8}
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M22 2 11 13" />
                <path d="m22 2-7 20-4-9-9-4 20-7z" />
              </svg>
            }
            title={
              <>
                Nessuna <em>richiesta</em> in coda.
              </>
            }
            description="Quando un ospite invia una richiesta su un tuo listing in modalità su richiesta, la troverai qui."
            actions={
              <DsLinkButton href="/host/dashboard" variant="accent" size="lg">
                Torna alla dashboard
              </DsLinkButton>
            }
          />
        ) : (
          <ul
            data-testid="host-requests-list"
            style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: "16px" }}
          >
            {requests.map((req) => {
              const netCents = req.amountCents - req.platformFeeCents;
              const deadline = req.hostDecisionDeadline ?? now;
              return (
                <li key={req.id} className="ds-listing-card" data-testid="host-request-row">
                  <div className={`ds-listing-photo${req.listing.photos[0] ? "" : " empty"}`}>
                    {req.listing.photos[0] ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={req.listing.photos[0].url} alt={req.listing.title} />
                    ) : (
                      <span>Nessuna foto</span>
                    )}
                  </div>
                  <div className="ds-listing-body">
                    <h2 className="ds-listing-title">{req.listing.title}</h2>
                    <span className="ds-listing-zone">{req.listing.addressDisplay}</span>
                    <div className="ds-listing-tags" style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                      <DsBadge variant="ghost">
                        {req.user.name ?? req.user.email}
                      </DsBadge>
                      <DsBadge variant="ghost">
                        {formatDateTimeIt(req.startsAt)} → {new Intl.DateTimeFormat("it-IT", { hour: "2-digit", minute: "2-digit" }).format(req.endsAt)}
                      </DsBadge>
                      <DsBadge variant="amber" data-testid="request-countdown">
                        Risposta entro {formatCountdown(deadline, now)}
                      </DsBadge>
                    </div>
                  </div>
                  <div className="ds-listing-side">
                    <div className="ds-listing-price">
                      €{formatPriceEur(netCents)}
                      <span className="unit"> netto</span>
                    </div>
                    <div className="ds-listing-actions" style={{ display: "flex", gap: 8, flexDirection: "column" }}>
                      <form action={approveBookingAction}>
                        <input type="hidden" name="bookingId" value={req.id} />
                        <button
                          type="submit"
                          className="ds-btn ds-btn-sm ds-btn-block ds-btn-accent"
                          data-testid="approve-button"
                        >
                          Approva richiesta
                        </button>
                      </form>
                      <form action={rejectBookingAction}>
                        <input type="hidden" name="bookingId" value={req.id} />
                        <button
                          type="submit"
                          className="ds-btn ds-btn-sm ds-btn-block"
                          data-testid="reject-button"
                        >
                          Rifiuta
                        </button>
                      </form>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </main>
    </div>
  );
}
