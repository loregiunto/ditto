import { describe, expect, it } from "vitest";
import { weeklyRulesToSlots, type WeeklyRule } from "@/lib/listings/availability";
import {
  DETAIL_HORIZON_DAYS,
  SUPER_HOST_PLACEHOLDER,
  toPublicDetailDTO,
} from "@/lib/listings/detail";

type DetailListingFixture = {
  id: string;
  title: string;
  description: string;
  addressFull: string;
  addressDisplay: string;
  hourlyPriceCents: number;
  hostType: "PRIVATE" | "BUSINESS";
  bookingMode: "INSTANT" | "REQUEST";
  photos: { url: string; order: number }[];
  host: {
    name: string | null;
    image: string | null;
    identityStatus: string | null;
  };
};

const SECRET_ADDRESS = "Via Privata Nascosta 7, Trastevere, Roma";

const baseListing: DetailListingFixture = {
  id: "lst-1",
  title: "Bagno del Cortile",
  description: "Bagno pulito, accessibile e ben illuminato.",
  addressFull: SECRET_ADDRESS,
  addressDisplay: "Trastevere",
  hourlyPriceCents: 350,
  hostType: "PRIVATE",
  bookingMode: "INSTANT",
  photos: [
    { url: "https://cdn.example.com/second.jpg", order: 2 },
    { url: "https://cdn.example.com/cover.jpg", order: 0 },
    { url: "https://cdn.example.com/first.jpg", order: 1 },
  ],
  host: {
    name: "Marco",
    image: null,
    identityStatus: null,
  },
};

function makeListing(
  overrides: Partial<DetailListingFixture> = {},
): DetailListingFixture {
  return {
    ...baseListing,
    ...overrides,
    host: {
      ...baseListing.host,
      ...overrides.host,
    },
    photos: overrides.photos ?? baseListing.photos,
  };
}

function localDayKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

describe("toPublicDetailDTO", () => {
  it("never exposes addressFull in the DTO keys or serialized payload", () => {
    const dto = toPublicDetailDTO(makeListing());

    expect(Object.keys(dto)).not.toContain("addressFull");
    expect(JSON.stringify(dto)).not.toContain("addressFull");
    expect(JSON.stringify(dto)).not.toContain(SECRET_ADDRESS);
    expect(dto.addressDisplay).toBe("Trastevere");
  });

  it("maps verifiedBadge only when the host identity is verified", () => {
    expect(
      toPublicDetailDTO(
        makeListing({ host: { ...baseListing.host, identityStatus: "verified" } }),
      ).badges.verified,
    ).toBe(true);

    expect(
      toPublicDetailDTO(
        makeListing({ host: { ...baseListing.host, identityStatus: "pending" } }),
      ).badges.verified,
    ).toBe(false);

    expect(
      toPublicDetailDTO(
        makeListing({ host: { ...baseListing.host, identityStatus: null } }),
      ).badges.verified,
    ).toBe(false);
  });

  it("keeps superHostBadge false while the US-017 calculation is a placeholder", () => {
    expect(SUPER_HOST_PLACEHOLDER).toBe(false);
    expect(toPublicDetailDTO(makeListing()).badges.superHost).toBe(false);
  });

  it("orders photos by ascending order", () => {
    const dto = toPublicDetailDTO(makeListing());

    expect(dto.photos.map((photo) => photo.url)).toEqual([
      "https://cdn.example.com/cover.jpg",
      "https://cdn.example.com/first.jpg",
      "https://cdn.example.com/second.jpg",
    ]);
  });

  it("propagates bookingMode into the public DTO", () => {
    expect(
      toPublicDetailDTO(makeListing({ bookingMode: "INSTANT" })).bookingMode,
    ).toBe("INSTANT");
    expect(
      toPublicDetailDTO(makeListing({ bookingMode: "REQUEST" })).bookingMode,
    ).toBe("REQUEST");
  });
});

describe("detail slot projection", () => {
  it("uses a 7-day detail horizon", () => {
    expect(DETAIL_HORIZON_DAYS).toBe(7);
  });

  it("projects slots across exactly the next 7 calendar days when starting at midnight", () => {
    const from = new Date("2026-05-04T00:00:00"); // Monday
    const to = new Date(
      from.getTime() + DETAIL_HORIZON_DAYS * 24 * 60 * 60 * 1000,
    );
    const rules: WeeklyRule[] = Array.from({ length: 7 }, (_, dayOfWeek) => ({
      dayOfWeek,
      startMinute: 9 * 60,
      endMinute: 9 * 60 + 30,
    }));

    const slots = weeklyRulesToSlots(rules, from, to, 30, []);
    const groupedByDay = slots.reduce<Record<string, number>>((acc, slot) => {
      const key = localDayKey(slot.startsAt);
      acc[key] = (acc[key] ?? 0) + 1;
      return acc;
    }, {});

    expect(Object.keys(groupedByDay)).toEqual([
      "2026-05-04",
      "2026-05-05",
      "2026-05-06",
      "2026-05-07",
      "2026-05-08",
      "2026-05-09",
      "2026-05-10",
    ]);
    expect(Object.values(groupedByDay)).toEqual(new Array(7).fill(1));
  });

  it("excludes today's slots that start before now", () => {
    const now = new Date("2026-05-04T10:15:00"); // Monday
    const to = new Date("2026-05-04T12:00:00");
    const rules: WeeklyRule[] = [
      { dayOfWeek: 0, startMinute: 9 * 60, endMinute: 12 * 60 },
    ];

    const slots = weeklyRulesToSlots(rules, now, to, 30, []);

    expect(slots.map((slot) => slot.startsAt.toTimeString().slice(0, 5))).toEqual([
      "10:30",
      "11:00",
      "11:30",
    ]);
  });

  it("returns no detail slots when the listing has no availability rules", () => {
    const now = new Date("2026-05-04T00:00:00");
    const to = new Date(
      now.getTime() + DETAIL_HORIZON_DAYS * 24 * 60 * 60 * 1000,
    );

    expect(weeklyRulesToSlots([], now, to, 30, [])).toEqual([]);
  });
});
