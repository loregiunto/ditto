import { describe, it, expect } from "vitest";
import {
  AVAILABILITY_WINDOW_HOURS,
  FALLBACK_MAP_CENTER,
  toPublicMapDTO,
} from "@/lib/listings/discovery";
import { weeklyRulesToSlots } from "@/lib/listings/availability";

describe("discovery constants", () => {
  it("uses Roma as fallback map center and a 6h window", () => {
    expect(AVAILABILITY_WINDOW_HOURS).toBe(6);
    expect(FALLBACK_MAP_CENTER.lat).toBeCloseTo(41.9028);
    expect(FALLBACK_MAP_CENTER.lng).toBeCloseTo(12.4964);
  });
});

describe("toPublicMapDTO", () => {
  const baseListing = {
    id: "lst-1",
    title: "Bagno del Cortile",
    addressDisplay: "Trastevere",
    latitude: 41.88,
    longitude: 12.46,
    hourlyPriceCents: 350,
    hostType: "PRIVATE" as const,
    photos: [
      { url: "https://cdn/2.jpg", order: 1 },
      { url: "https://cdn/0.jpg", order: 0 },
      { url: "https://cdn/1.jpg", order: 2 },
    ],
  };

  it("never exposes addressFull in the DTO keys", () => {
    const dto = toPublicMapDTO(baseListing);
    expect(Object.keys(dto)).not.toContain("addressFull");
  });

  it("derives photoUrl from the photo with the lowest `order`", () => {
    const dto = toPublicMapDTO(baseListing);
    expect(dto.photoUrl).toBe("https://cdn/0.jpg");
  });

  it("returns null photoUrl when there are no photos", () => {
    const dto = toPublicMapDTO({ ...baseListing, photos: [] });
    expect(dto.photoUrl).toBeNull();
  });

  it("preserves all public fields", () => {
    const dto = toPublicMapDTO(baseListing);
    expect(dto.id).toBe("lst-1");
    expect(dto.title).toBe("Bagno del Cortile");
    expect(dto.addressDisplay).toBe("Trastevere");
    expect(dto.hourlyPriceCents).toBe(350);
    expect(dto.hostType).toBe("PRIVATE");
    expect(dto.latitude).toBeCloseTo(41.88);
    expect(dto.longitude).toBeCloseTo(12.46);
  });
});

describe("weeklyRulesToSlots — discovery 6h window", () => {
  it("returns at least one slot when a rule covers the current moment", () => {
    // Pick a Wednesday at 10:00 local time.
    const now = new Date("2025-05-07T10:00:00");
    const to = new Date(now.getTime() + AVAILABILITY_WINDOW_HOURS * 3600_000);
    const ourDay = (now.getDay() + 6) % 7;
    const slots = weeklyRulesToSlots(
      [{ dayOfWeek: ourDay, startMinute: 9 * 60, endMinute: 12 * 60 }],
      now,
      to,
    );
    expect(slots.length).toBeGreaterThan(0);
  });

  it("returns no slots when the only rule is on a different day outside the window", () => {
    const now = new Date("2025-05-07T10:00:00"); // Wed
    const to = new Date(now.getTime() + AVAILABILITY_WINDOW_HOURS * 3600_000);
    // Friday rule (2 days later) — far outside a 6h window
    const friday = (now.getDay() + 6 + 2) % 7;
    const slots = weeklyRulesToSlots(
      [{ dayOfWeek: friday, startMinute: 0, endMinute: 23 * 60 }],
      now,
      to,
    );
    expect(slots).toEqual([]);
  });
});
