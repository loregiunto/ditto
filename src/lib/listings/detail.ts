import type { ProjectedSlot } from "@/lib/listings/availability";

export const DETAIL_HORIZON_DAYS = 7;
export const DETAIL_SLOT_MINUTES = 30;
export const SUPER_HOST_PLACEHOLDER = false;

export type PublicHostType = "PRIVATE" | "BUSINESS";
export type PublicBookingMode = "INSTANT" | "REQUEST";

export type ReviewItem = {
  id: string;
  authorName: string;
  authorImage: string | null;
  rating: number;
  createdAt: string;
  body: string;
};

export type ReviewsSummary = {
  averageRating: number | null;
  totalCount: number;
  items: ReviewItem[];
};

export const EMPTY_REVIEWS: ReviewsSummary = {
  averageRating: null,
  totalCount: 0,
  items: [],
};

export type PublicListingDetail = {
  id: string;
  title: string;
  description: string;
  addressDisplay: string;
  latitude: number;
  longitude: number;
  hourlyPriceCents: number;
  hostType: PublicHostType;
  bookingMode: PublicBookingMode;
  photos: {
    id: string;
    url: string;
    order: number;
  }[];
  host: {
    name: string | null;
    image: string | null;
    identityStatus: string | null;
  };
  badges: {
    verified: boolean;
    superHost: boolean;
  };
  reviews: ReviewsSummary;
};

type ListingForPublicDetailDTO = {
  id: string;
  title: string;
  description: string;
  addressDisplay: string;
  latitude: number;
  longitude: number;
  hourlyPriceCents: number;
  hostType: PublicHostType;
  bookingMode: PublicBookingMode;
  photos: { id: string; url: string; order: number }[];
  host: {
    name: string | null;
    image: string | null;
    identityStatus: string | null;
  };
};

export type PublicSlot = {
  id: string;
  dateKey: string;
  startsAt: string;
  endsAt: string;
  startTime: string;
  endTime: string;
};

export type PublicSlotDay = {
  dateKey: string;
  dateLabel: string;
  dayName: string;
  dayNumber: string;
  isToday: boolean;
  slots: PublicSlot[];
};

function isVerified(identityStatus: string | null): boolean {
  return identityStatus === "verified";
}

export function toPublicDetailDTO(
  listing: ListingForPublicDetailDTO,
): PublicListingDetail {
  return {
    id: listing.id,
    title: listing.title,
    description: listing.description,
    addressDisplay: listing.addressDisplay,
    latitude: listing.latitude,
    longitude: listing.longitude,
    hourlyPriceCents: listing.hourlyPriceCents,
    hostType: listing.hostType,
    bookingMode: listing.bookingMode,
    photos: [...listing.photos].sort((a, b) => a.order - b.order),
    host: {
      name: listing.host.name,
      image: listing.host.image,
      identityStatus: listing.host.identityStatus,
    },
    badges: {
      verified: isVerified(listing.host.identityStatus),
      superHost: SUPER_HOST_PLACEHOLDER,
    },
    reviews: EMPTY_REVIEWS,
  };
}

function dateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function timeLabel(date: Date): string {
  return `${String(date.getHours()).padStart(2, "0")}:${String(
    date.getMinutes(),
  ).padStart(2, "0")}`;
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

export function toPublicSlotDays(
  slots: ProjectedSlot[],
  from: Date,
  horizonDays: number = DETAIL_HORIZON_DAYS,
): PublicSlotDay[] {
  const slotsByDay = new Map<string, PublicSlot[]>();

  for (const slot of slots) {
    const key = dateKey(slot.startsAt);
    const publicSlot: PublicSlot = {
      id: `${key}-${timeLabel(slot.startsAt)}`,
      dateKey: key,
      startsAt: slot.startsAt.toISOString(),
      endsAt: slot.endsAt.toISOString(),
      startTime: timeLabel(slot.startsAt),
      endTime: timeLabel(slot.endsAt),
    };
    slotsByDay.set(key, [...(slotsByDay.get(key) ?? []), publicSlot]);
  }

  const todayKey = dateKey(from);
  return Array.from({ length: horizonDays }, (_, index) => {
    const date = addDays(from, index);
    const key = dateKey(date);
    return {
      dateKey: key,
      dateLabel: new Intl.DateTimeFormat("it-IT", {
        weekday: "short",
        day: "numeric",
        month: "short",
      }).format(date),
      dayName:
        index === 0
          ? "Oggi"
          : new Intl.DateTimeFormat("it-IT", { weekday: "short" }).format(date),
      dayNumber: String(date.getDate()).padStart(2, "0"),
      isToday: key === todayKey,
      slots: slotsByDay.get(key) ?? [],
    };
  });
}
