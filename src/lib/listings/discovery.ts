/**
 * Public DTOs and constants used by the discovery / map surface.
 *
 * The `addressFull` field of a listing is intentionally absent from any type
 * exported here — privacy is enforced structurally through the Prisma `select`
 * upstream and the shape of `PublicMapListing`.
 */

export const AVAILABILITY_WINDOW_HOURS = 6;

export const FALLBACK_MAP_CENTER = {
  lng: 12.4964,
  lat: 41.9028,
  zoom: 12,
} as const;

export const SEARCH_RADIUS_KM = 1;
export const GEOCODE_AUTOCOMPLETE_LIMIT = 5;

export type PublicHostType = "PRIVATE" | "BUSINESS";

export type PublicMapListing = {
  id: string;
  title: string;
  addressDisplay: string;
  latitude: number;
  longitude: number;
  hourlyPriceCents: number;
  hostType: PublicHostType;
  photoUrl: string | null;
};

type ListingForPublicDTO = {
  id: string;
  title: string;
  addressDisplay: string;
  latitude: number;
  longitude: number;
  hourlyPriceCents: number;
  hostType: PublicHostType;
  photos: { url: string; order: number }[];
};

export function toPublicMapDTO(listing: ListingForPublicDTO): PublicMapListing {
  const firstPhoto = [...listing.photos].sort((a, b) => a.order - b.order)[0];
  return {
    id: listing.id,
    title: listing.title,
    addressDisplay: listing.addressDisplay,
    latitude: listing.latitude,
    longitude: listing.longitude,
    hourlyPriceCents: listing.hourlyPriceCents,
    hostType: listing.hostType,
    photoUrl: firstPhoto?.url ?? null,
  };
}
