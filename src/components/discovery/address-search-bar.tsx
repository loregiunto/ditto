"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Locate, Search, X, MapPin } from "lucide-react";
import type { GeocodeSuggestion } from "@/lib/mapbox";

export type AddressSelection = {
  id: string;
  label: string;
  addressDisplay: string;
  latitude: number;
  longitude: number;
};

type Props = {
  onPlaceSelected: (sel: AddressSelection) => void;
  onUseMyLocation: () => void;
  onClear?: () => void;
};

const DEBOUNCE_MS = 250;
const MIN_QUERY_LENGTH = 2;

function highlight(text: string, query: string): React.ReactNode {
  if (!query) return text;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx < 0) return text;
  return (
    <>
      {text.slice(0, idx)}
      <mark>{text.slice(idx, idx + query.length)}</mark>
      {text.slice(idx + query.length)}
    </>
  );
}

export function AddressSearchBar({
  onPlaceSelected,
  onUseMyLocation,
  onClear,
}: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GeocodeSuggestion[]>([]);
  const [activeIdx, setActiveIdx] = useState(-1);
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const listboxId = useId();

  // Debounced fetch
  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < MIN_QUERY_LENGTH) {
      setResults([]);
      setActiveIdx(-1);
      return;
    }
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/geocode/search?q=${encodeURIComponent(trimmed)}`,
          { signal: ctrl.signal },
        );
        if (!res.ok) {
          setResults([]);
          return;
        }
        const data = (await res.json()) as { results: GeocodeSuggestion[] };
        setResults(data.results);
        setActiveIdx(data.results.length > 0 ? 0 : -1);
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          setResults([]);
        }
      }
    }, DEBOUNCE_MS);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [query]);

  // Close on outside click
  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const showDropdown = open && query.trim().length >= MIN_QUERY_LENGTH;
  const showEmpty = showDropdown && results.length === 0;

  function selectIndex(i: number) {
    const r = results[i];
    if (!r) return;
    setOpen(false);
    setQuery(r.label);
    onPlaceSelected({
      id: r.id,
      label: r.label,
      addressDisplay: r.addressDisplay,
      latitude: r.latitude,
      longitude: r.longitude,
    });
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (results.length === 0) return;
      setOpen(true);
      setActiveIdx((i) => (i + 1) % results.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (results.length === 0) return;
      setOpen(true);
      setActiveIdx((i) => (i <= 0 ? results.length - 1 : i - 1));
    } else if (e.key === "Enter") {
      if (showDropdown && activeIdx >= 0) {
        e.preventDefault();
        selectIndex(activeIdx);
      }
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  function handleClear() {
    setQuery("");
    setResults([]);
    setActiveIdx(-1);
    setOpen(false);
    onClear?.();
    inputRef.current?.focus();
  }

  const activeId =
    activeIdx >= 0 && results[activeIdx]
      ? `${listboxId}-opt-${activeIdx}`
      : undefined;

  return (
    <div
      ref={containerRef}
      className={`hr-address-search${showDropdown ? " open" : ""}`}
      role="combobox"
      aria-expanded={showDropdown}
      aria-haspopup="listbox"
      aria-owns={listboxId}
      data-testid="address-search"
    >
      <div className="hr-as-input">
        <Search className="hr-as-icon" aria-hidden />
        <input
          ref={inputRef}
          type="text"
          value={query}
          placeholder="Cerca un indirizzo, una via, una piazza…"
          aria-label="Cerca per indirizzo"
          aria-autocomplete="list"
          aria-controls={listboxId}
          aria-activedescendant={activeId}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          data-testid="address-search-input"
        />
        {query && (
          <button
            type="button"
            className="hr-as-clear"
            aria-label="Pulisci"
            onClick={handleClear}
            data-testid="address-search-clear"
          >
            <X aria-hidden />
          </button>
        )}
        <button
          type="button"
          className="hr-as-locate"
          title="Usa la mia posizione"
          onClick={() => {
            handleClear();
            onUseMyLocation();
          }}
          data-testid="address-search-locate"
        >
          <span className="hr-locate-dot" aria-hidden />
          <Locate aria-hidden />
          <span>Usa la mia posizione</span>
        </button>
      </div>

      {showDropdown && (
        <div className="hr-as-dropdown">
          <div className="hr-as-dd-header">
            <span className="hr-as-dd-label">Suggerimenti</span>
            <span className="hr-as-dd-attribution">
              via <strong>Mapbox</strong>
            </span>
          </div>
          {showEmpty ? (
            <div className="hr-as-empty" data-testid="address-search-empty">
              Nessun risultato per &quot;{query.trim()}&quot;
            </div>
          ) : (
            <ul
              className="hr-as-results"
              role="listbox"
              id={listboxId}
              data-testid="address-search-listbox"
            >
              {results.map((r, i) => (
                <li
                  key={r.id}
                  id={`${listboxId}-opt-${i}`}
                  role="option"
                  aria-selected={i === activeIdx}
                  className={`hr-as-result${i === activeIdx ? " active" : ""}`}
                  onMouseEnter={() => setActiveIdx(i)}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    selectIndex(i);
                  }}
                  data-testid="address-search-result"
                >
                  <div className="hr-as-result-icon">
                    <MapPin aria-hidden />
                  </div>
                  <div className="hr-as-result-body">
                    <div className="hr-as-result-primary">
                      {highlight(r.label.split(",")[0] ?? r.label, query.trim())}
                    </div>
                    <div className="hr-as-result-secondary">
                      {r.addressDisplay}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
          <div className="hr-as-dd-footer">
            <div className="hr-hints">
              <span className="hr-hint">
                <span className="hr-kbd">↑↓</span> Naviga
              </span>
              <span className="hr-hint">
                <span className="hr-kbd">↵</span> Seleziona
              </span>
              <span className="hr-hint">
                <span className="hr-kbd">Esc</span> Chiudi
              </span>
            </div>
            <div className="hr-hint" style={{ fontSize: 11 }}>
              Raggio di ricerca: <strong>1 km</strong>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
