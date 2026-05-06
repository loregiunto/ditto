"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useState } from "react";

const MapView = dynamic(
  () => import("./map-view").then((m) => m.MapView),
  { ssr: false },
);

type Props = {
  authedUserName: string | null;
};

type GeoStatus = "pending" | "granted" | "denied" | "unsupported";

export function MapHome({ authedUserName }: Props) {
  const [geoStatus, setGeoStatus] = useState<GeoStatus>("pending");
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const [listingCount, setListingCount] = useState<number | null>(null);

  const showGeoBanner =
    !bannerDismissed && (geoStatus === "denied" || geoStatus === "unsupported");
  const showEmptyState = listingCount === 0;

  return (
    <div className="hr-map-shell">
      <MapView onGeoStatusChange={setGeoStatus} onListingsLoaded={setListingCount} />

      <header className="hr-topbar">
        <Link href="/" className="hr-brand">
          <div className="hr-brand-mark">h</div>
          <div className="hr-brand-name">
            Home<em>Rest</em>
          </div>
        </Link>
        <div className="hr-topbar-actions">
          {authedUserName ? (
            <>
              <Link href="/host/dashboard" className="hr-btn hr-btn-ghost">
                Diventa host
              </Link>
              <Link href="/dashboard" className="hr-btn hr-btn-primary">
                {authedUserName}
              </Link>
              <form action="/auth/signout" method="post">
                <button type="submit" className="hr-btn">
                  Esci
                </button>
              </form>
            </>
          ) : (
            <>
              <Link href="/host/dashboard" className="hr-btn hr-btn-ghost">
                Diventa host
              </Link>
              <Link href="/auth/signin" className="hr-btn">
                Accedi
              </Link>
              <Link href="/auth/signin" className="hr-btn hr-btn-primary">
                Registrati
              </Link>
            </>
          )}
        </div>
      </header>

      {showGeoBanner && (
        <div className="hr-banner warn" role="status" data-testid="geo-banner">
          <span className="hr-banner-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
              <line x1="3" y1="3" x2="21" y2="21" />
            </svg>
          </span>
          <div>
            <strong>Posizione non disponibile.</strong> Mostriamo Roma centro
            come riferimento.
          </div>
          <button
            type="button"
            className="hr-banner-action"
            onClick={() => {
              setBannerDismissed(false);
              setGeoStatus("pending");
              if (typeof navigator !== "undefined" && navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                  () => setGeoStatus("granted"),
                  () => setGeoStatus("denied"),
                );
              }
            }}
          >
            Riprova
          </button>
          <button
            type="button"
            className="hr-banner-close"
            aria-label="Chiudi"
            onClick={() => setBannerDismissed(true)}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      )}

      {showEmptyState && !showGeoBanner && (
        <div className="hr-empty-pill" data-testid="empty-state">
          Nessun bagno disponibile nella tua zona nelle prossime ore
        </div>
      )}
    </div>
  );
}
