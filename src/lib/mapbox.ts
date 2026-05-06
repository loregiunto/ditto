import "server-only";

export type GeocodeResult = {
  addressFull: string;
  addressDisplay: string;
  latitude: number;
  longitude: number;
};

export class GeocodingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "GeocodingError";
  }
}

type MapboxContext = { id: string; text: string };
type MapboxFeature = {
  place_name: string;
  center: [number, number];
  context?: MapboxContext[];
  text?: string;
};
type MapboxResponse = { features?: MapboxFeature[] };

function deriveDisplay(feature: MapboxFeature): string {
  const ctx = feature.context ?? [];
  const neighborhood = ctx.find((c) => c.id.startsWith("neighborhood"))?.text;
  const locality = ctx.find((c) => c.id.startsWith("locality"))?.text;
  const place = ctx.find((c) => c.id.startsWith("place"))?.text;
  const region = ctx.find((c) => c.id.startsWith("region"))?.text;

  const zone = neighborhood ?? locality;
  const city = place ?? region;

  if (zone && city) return `${zone}, ${city}`;
  if (city) return city;
  if (zone) return zone;
  return feature.text ?? feature.place_name.split(",")[0] ?? "";
}

export async function geocodeAddress(address: string): Promise<GeocodeResult> {
  const token = process.env.MAPBOX_ACCESS_TOKEN;
  if (!token) {
    throw new GeocodingError("MAPBOX_ACCESS_TOKEN is not configured");
  }

  const trimmed = address.trim();
  if (!trimmed) {
    throw new GeocodingError("Indirizzo vuoto");
  }

  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
    trimmed,
  )}.json?limit=1&access_token=${token}`;

  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    throw new GeocodingError(`Mapbox HTTP ${res.status}`);
  }

  const data = (await res.json()) as MapboxResponse;
  const feature = data.features?.[0];
  if (!feature) {
    throw new GeocodingError("Indirizzo non trovato");
  }

  const [longitude, latitude] = feature.center;

  return {
    addressFull: feature.place_name,
    addressDisplay: deriveDisplay(feature),
    latitude,
    longitude,
  };
}

export const __testing = { deriveDisplay };
