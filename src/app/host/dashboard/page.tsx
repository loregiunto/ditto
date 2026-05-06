import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/user";
import { prisma } from "@/lib/prisma";
import {
  canPublish,
  CAN_PUBLISH_REASON_MESSAGES,
} from "@/lib/listings/can-publish";
import {
  DsTopnav,
  DsDisplayTitle,
  DsBadge,
  DsEmptyState,
  DsLinkButton,
} from "@/components/design-system";
import type { DsBadgeVariant } from "@/components/design-system";
import { ListingStatusToggle } from "./listing-status-toggle";

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<"DRAFT" | "ACTIVE" | "INACTIVE", string> = {
  DRAFT: "Bozza",
  ACTIVE: "Attivo",
  INACTIVE: "Disattivato",
};

const STATUS_BADGE_VARIANT: Record<
  "DRAFT" | "ACTIVE" | "INACTIVE",
  DsBadgeVariant
> = {
  DRAFT: "draft",
  ACTIVE: "active",
  INACTIVE: "inactive",
};

export default async function HostDashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/signin");

  const [listings, gate] = await Promise.all([
    prisma.listing.findMany({
      where: { hostId: user.id },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        title: true,
        addressDisplay: true,
        hourlyPriceCents: true,
        status: true,
        hostType: true,
        photos: {
          orderBy: { order: "asc" },
          take: 1,
          select: { url: true },
        },
      },
    }),
    Promise.resolve(canPublish(user)),
  ]);

  const hasPublishableListing = listings.some((l) => l.status !== "ACTIVE");
  const blockReason =
    !gate.ok && hasPublishableListing
      ? CAN_PUBLISH_REASON_MESSAGES[gate.reason]
      : null;

  return (
    <div className="ds-surface">
      <DsTopnav
        rightSlot={
          <DsLinkButton href="/dashboard" variant="ghost" size="sm">
            Account
          </DsLinkButton>
        }
      />

      <main className="ds-page">
        <section className="ds-title-block">
          <DsDisplayTitle
            eyebrow="Dashboard host"
            text="I tuoi bagni"
            subtitle="Pubblica un listing per renderlo visibile sulla mappa, o disattivalo per nasconderlo temporaneamente."
          />
          <div className="ds-title-actions">
            <DsLinkButton
              href="/host/listings/new"
              variant="accent"
              size="lg"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                aria-hidden="true"
              >
                <path d="M12 5v14M5 12h14" />
              </svg>
              Nuovo bagno
            </DsLinkButton>
          </div>
        </section>

        {blockReason && (
          <section className="ds-alert-callout" role="status">
            <div>
              <strong>
                Manca un <em>passo</em> per pubblicare.
              </strong>
              <p>{blockReason}</p>
            </div>
          </section>
        )}

        {listings.length === 0 ? (
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
                <path d="M3 10h18l-1 11H4z" />
                <path d="M8 10V6a4 4 0 0 1 8 0v4" />
                <circle cx="12" cy="15" r="1.5" />
              </svg>
            }
            title={
              <>
                Il primo <em>bagno</em> è una storia.
              </>
            }
            description="Inizia descrivendo lo spazio, scegli quanto chiedere, aggiungi foto ben fatte. Ti guidiamo passo passo."
            actions={
              <DsLinkButton
                href="/host/listings/new"
                variant="accent"
                size="lg"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  aria-hidden="true"
                >
                  <path d="M12 5v14M5 12h14" />
                </svg>
                Crea il tuo primo bagno
              </DsLinkButton>
            }
          />
        ) : (
          <ul className="ds-listing-grid" style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {listings.map((l) => (
              <li
                key={l.id}
                className={`ds-listing-card${l.status === "INACTIVE" ? " is-inactive" : ""}`}
              >
                <div
                  className={`ds-listing-photo${l.photos[0] ? "" : " empty"}`}
                >
                  <DsBadge
                    variant={STATUS_BADGE_VARIANT[l.status]}
                    withDot
                    className="ds-photo-status"
                    data-testid="listing-status-badge"
                  >
                    {STATUS_LABEL[l.status]}
                  </DsBadge>
                  {l.photos[0] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={l.photos[0].url} alt={l.title} />
                  ) : (
                    <span>Nessuna foto</span>
                  )}
                </div>

                <div className="ds-listing-body">
                  <h2 className="ds-listing-title">{l.title}</h2>
                  <span className="ds-listing-zone">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                      aria-hidden="true"
                    >
                      <path d="M12 22s-7-7.5-7-13a7 7 0 0 1 14 0c0 5.5-7 13-7 13z" />
                      <circle cx="12" cy="9" r="2.5" />
                    </svg>
                    {l.addressDisplay}
                  </span>
                  <div className="ds-listing-tags">
                    <DsBadge
                      variant={l.hostType === "PRIVATE" ? "private" : "business"}
                    >
                      {l.hostType === "PRIVATE" ? "Privato" : "Attività"}
                    </DsBadge>
                  </div>
                </div>

                <div className="ds-listing-side">
                  <div className="ds-listing-price">
                    €{(l.hourlyPriceCents / 100).toFixed(2).replace(".", ",")}
                    <span className="unit"> / ora</span>
                  </div>
                  <div className="ds-listing-actions">
                    <ListingStatusToggle
                      listingId={l.id}
                      status={l.status}
                      canPublish={gate.ok}
                      blockReason={blockReason}
                    />
                    <Link
                      href={`/host/listings/${l.id}/availability`}
                      className="ds-btn ds-btn-sm ds-btn-block"
                      data-testid="manage-availability-link"
                    >
                      Gestisci disponibilità
                    </Link>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
