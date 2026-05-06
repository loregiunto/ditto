"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { AddressSearchBar, type AddressSelection } from "./address-search-bar";

const MapView = dynamic(
  () => import("./map-view").then((m) => m.MapView),
  { ssr: false },
);

type Props = {
  authedUserName: string | null;
};

type GeoStatus = "pending" | "granted" | "denied" | "unsupported";
type LoadStatus =
  | { kind: "loading" }
  | { kind: "ok"; count: number }
  | { kind: "error" };

export function MapHome({ authedUserName }: Props) {
  const [geoStatus, setGeoStatus] = useState<GeoStatus>("pending");
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const [loadStatus, setLoadStatus] = useState<LoadStatus>({ kind: "loading" });
  const [retryNonce, setRetryNonce] = useState(0);
  const [search, setSearch] = useState<AddressSelection | null>(null);
  const [geolocateNonce, setGeolocateNonce] = useState(0);
  const lastEmptyToastKeyRef = useRef<string | null>(null);

  // Empty-radius toast: fire once per (searchId, count==0) transition.
  useEffect(() => {
    if (!search) {
      lastEmptyToastKeyRef.current = null;
      return;
    }
    if (loadStatus.kind === "ok" && loadStatus.count === 0) {
      const key = search.id;
      if (lastEmptyToastKeyRef.current !== key) {
        lastEmptyToastKeyRef.current = key;
        toast(
          `Nessun bagno nel raggio di 1 km da ${search.addressDisplay || search.label}`,
        );
      }
    }
  }, [search, loadStatus]);

  const showGeoBanner =
    !bannerDismissed && (geoStatus === "denied" || geoStatus === "unsupported");
  const showLoadError = loadStatus.kind === "error";
  const showEmptyState =
    !search && loadStatus.kind === "ok" && loadStatus.count === 0;

  return (
    <div className="hr-map-shell">
      <MapView
        key={retryNonce}
        onGeoStatusChange={setGeoStatus}
        onLoadStatusChange={setLoadStatus}
        searchFocus={search}
        geolocateNonce={geolocateNonce}
      />

      <header className="hr-topbar">
        <Link href="/" className="hr-brand">
          <div className="hr-brand-mark">h</div>
          <div className="hr-brand-name">
            Home<em>Rest</em>
          </div>
        </Link>
        <AddressSearchBar
          onPlaceSelected={(s) => setSearch(s)}
          onUseMyLocation={() => {
            setSearch(null);
            setGeolocateNonce((n) => n + 1);
          }}
          onClear={() => setSearch(null)}
        />
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

      {search && (
        <div
          className="hr-search-pill"
          role="status"
          data-testid="search-pill"
        >
          <span className="hr-search-pill-label">
            {search.addressDisplay || search.label}
          </span>
          <span className="hr-search-pill-radius">· raggio 1 km</span>
          <button
            type="button"
            className="hr-search-pill-close"
            aria-label="Rimuovi filtro indirizzo"
            onClick={() => setSearch(null)}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      )}

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

      {showLoadError && !showGeoBanner && (
        <div className="hr-banner warn" role="alert" data-testid="load-error-banner">
          <span className="hr-banner-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </span>
          <div>
            <strong>Impossibile caricare i bagni.</strong> Controlla la connessione
            e riprova.
          </div>
          <button
            type="button"
            className="hr-banner-action"
            onClick={() => {
              setLoadStatus({ kind: "loading" });
              setRetryNonce((n) => n + 1);
            }}
          >
            Riprova
          </button>
        </div>
      )}

      {showEmptyState && !showGeoBanner && !showLoadError && (
        <div className="hr-empty-pill" data-testid="empty-state">
          Nessun bagno disponibile nella tua zona nelle prossime ore
        </div>
      )}
    </div>
  );
}
