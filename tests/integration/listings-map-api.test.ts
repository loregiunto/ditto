import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    listing: {
      findMany: vi.fn(),
    },
  },
}));

import { GET } from "@/app/api/listings/map/route";
import { prisma } from "@/lib/prisma";

const SECRET_ADDRESS = "Via Privata Nascosta 7, Trastevere, Roma";

type ListingRow = {
  id: string;
  title: string;
  addressDisplay: string;
  latitude: number;
  longitude: number;
  hourlyPriceCents: number;
  hostType: "PRIVATE" | "BUSINESS";
  photos: { url: string; order: number }[];
  availabilityRules: { dayOfWeek: number; startMinute: number; endMinute: number }[];
};

function makeListing(overrides: Partial<ListingRow> = {}): ListingRow {
  // A rule covering ALL hours of EVERY day → always inside any 6h window.
  const allDayEveryDay = Array.from({ length: 7 }, (_, day) => ({
    dayOfWeek: day,
    startMinute: 0,
    endMinute: 24 * 60,
  }));
  return {
    id: "lst-1",
    title: "Bagno del Cortile",
    addressDisplay: "Trastevere",
    latitude: 41.88,
    longitude: 12.46,
    hourlyPriceCents: 350,
    hostType: "PRIVATE",
    photos: [{ url: "https://cdn/photo.jpg", order: 0 }],
    availabilityRules: allDayEveryDay,
    ...overrides,
  };
}

describe("GET /api/listings/map", () => {
  beforeEach(() => {
    vi.mocked(prisma.listing.findMany).mockReset();
  });

  it("returns 200 without an authenticated session", async () => {
    vi.mocked(prisma.listing.findMany).mockResolvedValue([]);
    const res = await GET();
    expect(res.status).toBe(200);
  });

  it("only queries ACTIVE listings", async () => {
    vi.mocked(prisma.listing.findMany).mockResolvedValue([]);
    await GET();
    const arg = vi.mocked(prisma.listing.findMany).mock.calls[0][0];
    expect(arg?.where).toEqual({ status: "ACTIVE" });
  });

  it("queries the DB with an exact public-fields whitelist (no addressFull, ever)", async () => {
    // Structural privacy guarantee: any regression that adds `addressFull` to
    // the select — directly or via spread — fails this test. We assert the
    // full set of selected keys, not just the absence of `addressFull`, so the
    // test breaks if a future change widens the projection by accident.
    vi.mocked(prisma.listing.findMany).mockResolvedValue([]);
    await GET();
    const arg = vi.mocked(prisma.listing.findMany).mock.calls[0][0];
    const select = (arg?.select ?? {}) as Record<string, unknown>;
    const allowedTopLevel = new Set([
      "id",
      "title",
      "addressDisplay",
      "latitude",
      "longitude",
      "hourlyPriceCents",
      "hostType",
      "photos",
      "availabilityRules",
    ]);
    expect(new Set(Object.keys(select))).toEqual(allowedTopLevel);
    expect(select.addressFull).toBeUndefined();

    // The nested selects must also avoid addressFull and stay minimal.
    const photos = select.photos as { select?: Record<string, unknown> };
    expect(new Set(Object.keys(photos.select ?? {}))).toEqual(
      new Set(["url", "order"]),
    );
    const rules = select.availabilityRules as { select?: Record<string, unknown> };
    expect(new Set(Object.keys(rules.select ?? {}))).toEqual(
      new Set(["dayOfWeek", "startMinute", "endMinute"]),
    );
  });

  it("excludes ACTIVE listings without availability in the next 6 hours", async () => {
    vi.mocked(prisma.listing.findMany).mockResolvedValue([
      makeListing({ id: "with-avail" }),
      makeListing({ id: "no-avail", availabilityRules: [] }),
    ] as never);
    const res = await GET();
    const data = (await res.json()) as { listings: { id: string }[] };
    const ids = data.listings.map((l) => l.id);
    expect(ids).toContain("with-avail");
    expect(ids).not.toContain("no-avail");
  });

  it("never leaks addressFull in the response body", async () => {
    vi.mocked(prisma.listing.findMany).mockResolvedValue([
      makeListing(),
      makeListing({ id: "lst-2", title: "Altro bagno" }),
    ] as never);
    const res = await GET();
    const text = await res.text();
    expect(text).not.toContain("addressFull");
    expect(text).not.toContain(SECRET_ADDRESS);
  });

  it("derives photoUrl from the photo with lowest order, null when no photos", async () => {
    vi.mocked(prisma.listing.findMany).mockResolvedValue([
      makeListing({
        id: "with-photos",
        photos: [
          { url: "https://cdn/2.jpg", order: 2 },
          { url: "https://cdn/first.jpg", order: 0 },
          { url: "https://cdn/1.jpg", order: 1 },
        ],
      }),
      makeListing({ id: "no-photos", photos: [] }),
    ] as never);
    const res = await GET();
    const data = (await res.json()) as {
      listings: { id: string; photoUrl: string | null }[];
    };
    const byId = Object.fromEntries(data.listings.map((l) => [l.id, l]));
    expect(byId["with-photos"].photoUrl).toBe("https://cdn/first.jpg");
    expect(byId["no-photos"].photoUrl).toBeNull();
  });
});
