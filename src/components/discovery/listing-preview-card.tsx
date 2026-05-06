"use client";

import type { PublicMapListing } from "@/lib/listings/discovery";

type Props = {
  listing: PublicMapListing;
  onClose: () => void;
};

const HOST_TYPE_LABEL: Record<PublicMapListing["hostType"], string> = {
  PRIVATE: "Privato",
  BUSINESS: "Attività",
};

const HOST_TYPE_BADGE_CLASS: Record<PublicMapListing["hostType"], string> = {
  PRIVATE: "hr-badge-pill hr-badge-private",
  BUSINESS: "hr-badge-pill hr-badge-business",
};

const HOST_TYPE_EMOJI: Record<PublicMapListing["hostType"], string> = {
  PRIVATE: "🏠",
  BUSINESS: "🏪",
};

function formatPrice(cents: number): string {
  return (cents / 100).toFixed(2).replace(".", ",");
}

export function ListingPreviewCard({ listing, onClose }: Props) {
  return (
    <div
      className="hr-preview-card"
      data-testid="listing-preview-card"
      data-listing-id={listing.id}
    >
      <div className="hr-pc-photo">
        {listing.photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={listing.photoUrl} alt={listing.title} />
        ) : null}
        <span className="hr-photo-tag">
          <span className="hr-dot" />
          Disponibile ora
        </span>
        <button
          type="button"
          aria-label="Chiudi"
          className="hr-banner-close"
          style={{ position: "absolute", top: 12, right: 12, background: "rgba(255,255,255,0.92)" }}
          onClick={onClose}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      <div className="hr-pc-body">
        <div className="hr-pc-meta-row">
          <span className={HOST_TYPE_BADGE_CLASS[listing.hostType]}>
            <span style={{ fontSize: 11 }}>{HOST_TYPE_EMOJI[listing.hostType]}</span>{" "}
            {HOST_TYPE_LABEL[listing.hostType]}
          </span>
        </div>

        <h3 className="hr-pc-name" data-testid="listing-preview-title">
          {listing.title}
        </h3>

        <div className="hr-pc-zone">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="13" height="13">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
          {listing.addressDisplay}
        </div>

        <div className="hr-pc-stats">
          <div>
            <div className="hr-stat-num" data-testid="listing-preview-price">
              €{formatPrice(listing.hourlyPriceCents)}
              <span className="hr-unit">/h</span>
            </div>
            <div className="hr-stat-label">Prezzo</div>
          </div>
          <div style={{ textAlign: "center" }} className="hr-stat-rating">
            <span className="hr-new-tag">Nuovo</span>
            <div className="hr-stat-label" style={{ marginTop: 6 }}>
              Recensioni
            </div>
          </div>
        </div>

        <div className="hr-pc-cta">
          <button
            type="button"
            className="hr-btn"
            disabled
            title="Disponibile a breve"
          >
            Dettagli
          </button>
          <button
            type="button"
            className="hr-btn hr-btn-accent"
            disabled
            title="Disponibile a breve"
          >
            Prenota ora
          </button>
        </div>
      </div>
    </div>
  );
}
