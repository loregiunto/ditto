"use client";

import { useEffect, useRef, useState } from "react";
import { createRoot, type Root } from "react-dom/client";
import "mapbox-gl/dist/mapbox-gl.css";
import "./map.css";
import type {
  Map as MapboxMap,
  GeoJSONSource,
  Marker as MapboxMarker,
  Popup as MapboxPopup,
  LngLatLike,
} from "mapbox-gl";
import {
  FALLBACK_MAP_CENTER,
  SEARCH_RADIUS_KM,
  type PublicMapListing,
} from "@/lib/listings/discovery";
import { filterListingsByRadius } from "@/lib/geo/distance";
import { ListingPreviewCard } from "./listing-preview-card";

type GeoStatus = "pending" | "granted" | "denied" | "unsupported";

const SOURCE_ID = "hr-listings";
const CLUSTER_LAYER = "hr-clusters";
const POINT_LAYER = "hr-points";
// We don't render the point layer visually (HTML markers replace it), but the
// layer must exist so we can query unclustered features and Mapbox indexes them.

function priceLabel(cents: number): string {
  return `€${(cents / 100).toFixed(2).replace(".", ",")}/h`;
}

function makePinElement(listing: PublicMapListing): HTMLElement {
  const el = document.createElement("div");
  el.className = `hr-pin ${listing.hostType === "PRIVATE" ? "private" : "business"}`;
  el.dataset.testid = "map-pin";
  el.dataset.listingId = listing.id;
  el.innerHTML = `
    <div class="hr-pin-bubble">
      <span class="hr-pin-dot">€</span>
      <span>${(listing.hourlyPriceCents / 100).toFixed(2).replace(".", ",")}/h</span>
    </div>
  `;
  el.title = `${listing.title} — ${priceLabel(listing.hourlyPriceCents)}`;
  return el;
}

function makeClusterElement(count: number): HTMLElement {
  const el = document.createElement("div");
  const sizeClass = count >= 15 ? "lg" : count <= 4 ? "sm" : "";
  el.className = `hr-cluster ${sizeClass}`.trim();
  el.dataset.testid = "map-cluster";
  el.innerHTML = `<div class="hr-cluster-bubble">${count}</div>`;
  return el;
}

function makeMeElement(): HTMLElement {
  const el = document.createElement("div");
  el.className = "hr-me-dot";
  return el;
}

export type LoadStatus =
  | { kind: "loading" }
  | { kind: "ok"; count: number }
  | { kind: "error" };

export type SearchFocus = {
  latitude: number;
  longitude: number;
};

type Props = {
  onGeoStatusChange?: (status: GeoStatus) => void;
  onLoadStatusChange?: (status: LoadStatus) => void;
  searchFocus?: SearchFocus | null;
  geolocateNonce?: number;
};

export function MapView({
  onGeoStatusChange,
  onLoadStatusChange,
  searchFocus,
  geolocateNonce,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapboxMap | null>(null);
  const markersRef = useRef<Map<string, MapboxMarker>>(new Map());
  const popupRef = useRef<MapboxPopup | null>(null);
  const popupRootRef = useRef<Root | null>(null);
  const meMarkerRef = useRef<MapboxMarker | null>(null);
  const listingsRef = useRef<Map<string, PublicMapListing>>(new Map());
  const allListingsRef = useRef<PublicMapListing[]>([]);
  const selectedIdRef = useRef<string | null>(null);
  const searchFocusRef = useRef<SearchFocus | null>(null);
  const repaintRef = useRef<(() => void) | null>(null);
  const geolocateRef = useRef<(() => void) | null>(null);
  const onLoadStatusRef = useRef(onLoadStatusChange);
  onLoadStatusRef.current = onLoadStatusChange;

  const [, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let mapboxglModule: typeof import("mapbox-gl").default | null = null;

    (async () => {
      const mod = await import("mapbox-gl");
      mapboxglModule = mod.default;
      const mapboxgl = mapboxglModule;
      if (cancelled || !containerRef.current) return;

      const token = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
      if (token) {
        mapboxgl.accessToken = token;
      }

      const map = new mapboxgl.Map({
        container: containerRef.current,
        style: "mapbox://styles/mapbox/light-v11",
        center: [FALLBACK_MAP_CENTER.lng, FALLBACK_MAP_CENTER.lat],
        zoom: FALLBACK_MAP_CENTER.zoom,
        attributionControl: false,
      });
      mapRef.current = map;
      map.addControl(new mapboxgl.NavigationControl({ visualizePitch: false }), "bottom-right");
      map.addControl(new mapboxgl.GeolocateControl({ trackUserLocation: false }), "bottom-right");

      map.on("load", async () => {
        if (cancelled) return;
        await loadAndPaintListings();
      });

      function runGeolocate() {
        if (typeof navigator !== "undefined" && navigator.geolocation) {
          onGeoStatusChange?.("pending");
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              if (cancelled) return;
              onGeoStatusChange?.("granted");
              const here: LngLatLike = [
                pos.coords.longitude,
                pos.coords.latitude,
              ];
              map.flyTo({ center: here, zoom: 14, duration: 600 });
              placeMeMarker(here);
            },
            () => {
              if (cancelled) return;
              onGeoStatusChange?.("denied");
            },
            { enableHighAccuracy: false, timeout: 8000, maximumAge: 60_000 },
          );
        } else {
          onGeoStatusChange?.("unsupported");
        }
      }
      geolocateRef.current = runGeolocate;
      runGeolocate();
    })();

    function applyListings(listings: PublicMapListing[]) {
      const map = mapRef.current;
      const mapboxgl = mapboxglModule;
      if (!map || !mapboxgl) return;

      listingsRef.current = new Map(listings.map((l) => [l.id, l]));
      onLoadStatusRef.current?.({ kind: "ok", count: listings.length });

      const featureCollection: GeoJSON.FeatureCollection<GeoJSON.Point> = {
        type: "FeatureCollection",
        features: listings.map((l) => ({
          type: "Feature",
          id: l.id,
          properties: { listingId: l.id },
          geometry: { type: "Point", coordinates: [l.longitude, l.latitude] },
        })),
      };

      if (map.getSource(SOURCE_ID)) {
        (map.getSource(SOURCE_ID) as GeoJSONSource).setData(featureCollection);
        syncMarkers();
        return;
      }

      map.addSource(SOURCE_ID, {
        type: "geojson",
        data: featureCollection,
        cluster: true,
        clusterRadius: 50,
        clusterMaxZoom: 14,
      });
      map.addLayer({
        id: CLUSTER_LAYER,
        type: "circle",
        source: SOURCE_ID,
        filter: ["has", "point_count"],
        paint: { "circle-opacity": 0, "circle-radius": 1 },
      });
      map.addLayer({
        id: POINT_LAYER,
        type: "circle",
        source: SOURCE_ID,
        filter: ["!", ["has", "point_count"]],
        paint: { "circle-opacity": 0, "circle-radius": 1 },
      });
      map.on("sourcedata", (e) => {
        if (e.sourceId === SOURCE_ID && e.isSourceLoaded) syncMarkers();
      });
      map.on("moveend", syncMarkers);
      syncMarkers();
    }

    function repaintWithCurrentFocus() {
      const focus = searchFocusRef.current;
      const all = allListingsRef.current;
      const visible = focus
        ? filterListingsByRadius(all, focus, SEARCH_RADIUS_KM)
        : all;
      applyListings(visible);
    }
    repaintRef.current = repaintWithCurrentFocus;

    async function loadAndPaintListings() {
      const map = mapRef.current;
      const mapboxgl = mapboxglModule;
      if (!map || !mapboxgl) return;

      onLoadStatusRef.current?.({ kind: "loading" });
      let listings: PublicMapListing[] | null = null;
      try {
        const res = await fetch("/api/listings/map", { cache: "no-store" });
        if (res.ok) {
          const data = (await res.json()) as { listings: PublicMapListing[] };
          listings = data.listings;
        }
      } catch {
        // Fall through to error path below.
      }
      if (cancelled) return;

      if (listings === null) {
        onLoadStatusRef.current?.({ kind: "error" });
        return;
      }

      allListingsRef.current = listings;
      repaintWithCurrentFocus();
      setReady(true);
    }

    function syncMarkers() {
      const map = mapRef.current;
      const mapboxgl = mapboxglModule;
      if (!map || !mapboxgl || !map.getSource(SOURCE_ID)) return;

      const features = map.queryRenderedFeatures({
        layers: [CLUSTER_LAYER, POINT_LAYER],
      });

      const seen = new Set<string>();
      for (const f of features) {
        const props = f.properties ?? {};
        const geom = f.geometry as GeoJSON.Point;
        const coords = geom.coordinates as [number, number];

        if (props.cluster) {
          const clusterId = props.cluster_id as number;
          const count = props.point_count as number;
          const key = `cluster-${clusterId}`;
          seen.add(key);
          if (markersRef.current.has(key)) continue;

          const el = makeClusterElement(count);
          el.addEventListener("click", () => {
            const src = map.getSource(SOURCE_ID) as GeoJSONSource;
            src.getClusterExpansionZoom(clusterId, (err, zoom) => {
              if (err) return;
              map.easeTo({ center: coords, zoom: (zoom ?? map.getZoom()) + 0.5 });
            });
          });
          const marker = new mapboxgl.Marker({ element: el }).setLngLat(coords).addTo(map);
          markersRef.current.set(key, marker);
        } else {
          const listingId = String(props.listingId);
          const listing = listingsRef.current.get(listingId);
          if (!listing) continue;
          const key = `pin-${listingId}`;
          seen.add(key);
          if (markersRef.current.has(key)) continue;

          const el = makePinElement(listing);
          el.addEventListener("click", (ev) => {
            ev.stopPropagation();
            openPopupForListing(listing, coords);
          });
          const marker = new mapboxgl.Marker({
            element: el,
            anchor: "bottom",
          })
            .setLngLat(coords)
            .addTo(map);
          markersRef.current.set(key, marker);
        }
      }

      // Remove markers for features no longer rendered.
      for (const [key, marker] of markersRef.current) {
        if (!seen.has(key)) {
          marker.remove();
          markersRef.current.delete(key);
        }
      }
    }

    function placeMeMarker(coords: LngLatLike) {
      const map = mapRef.current;
      const mapboxgl = mapboxglModule;
      if (!map || !mapboxgl) return;
      meMarkerRef.current?.remove();
      const el = makeMeElement();
      meMarkerRef.current = new mapboxgl.Marker({ element: el })
        .setLngLat(coords)
        .addTo(map);
    }

    function openPopupForListing(
      listing: PublicMapListing,
      coords: [number, number],
    ) {
      const map = mapRef.current;
      const mapboxgl = mapboxglModule;
      if (!map || !mapboxgl) return;

      // Highlight the selected pin.
      if (selectedIdRef.current && selectedIdRef.current !== listing.id) {
        const prev = markersRef.current.get(`pin-${selectedIdRef.current}`);
        prev?.getElement().classList.remove("selected");
      }
      const cur = markersRef.current.get(`pin-${listing.id}`);
      cur?.getElement().classList.add("selected");
      selectedIdRef.current = listing.id;

      // Mount the React card inside a popup.
      const popupNode = document.createElement("div");
      popupRootRef.current?.unmount();
      popupRef.current?.remove();
      const root = createRoot(popupNode);
      popupRootRef.current = root;

      const popup = new mapboxgl.Popup({
        offset: 24,
        closeOnClick: false,
        anchor: "left",
        maxWidth: "340px",
      })
        .setLngLat(coords)
        .setDOMContent(popupNode)
        .addTo(map);
      popupRef.current = popup;

      const close = () => {
        popup.remove();
      };

      root.render(<ListingPreviewCard listing={listing} onClose={close} />);

      popup.on("close", () => {
        cur?.getElement().classList.remove("selected");
        selectedIdRef.current = null;
        // Defer unmount to avoid React unmount-during-render warning.
        queueMicrotask(() => root.unmount());
        if (popupRef.current === popup) popupRef.current = null;
        if (popupRootRef.current === root) popupRootRef.current = null;
      });
    }

    // expose helpers via refs so the focus/geolocate effects below can call them
    return () => {
      cancelled = true;
      for (const marker of markersRef.current.values()) marker.remove();
      markersRef.current.clear();
      meMarkerRef.current?.remove();
      meMarkerRef.current = null;
      popupRef.current?.remove();
      popupRef.current = null;
      const root = popupRootRef.current;
      popupRootRef.current = null;
      if (root) queueMicrotask(() => root.unmount());
      mapRef.current?.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Apply / clear search focus: refilter listings, flyTo the selection.
  useEffect(() => {
    searchFocusRef.current = searchFocus ?? null;
    repaintRef.current?.();
    const map = mapRef.current;
    if (map && searchFocus) {
      map.flyTo({
        center: [searchFocus.longitude, searchFocus.latitude],
        zoom: 14,
        duration: 600,
      });
    }
  }, [searchFocus]);

  // Re-trigger geolocation when the parent bumps the nonce.
  useEffect(() => {
    if (geolocateNonce === undefined) return;
    geolocateRef.current?.();
  }, [geolocateNonce]);

  return (
    <div
      ref={containerRef}
      className="hr-map-canvas"
      data-testid="map-view"
      aria-label="Mappa dei bagni disponibili"
    />
  );
}
