import { describe, it, expect } from "vitest";
import { validateBookingSlot } from "@/lib/bookings/availability";
import type { WeeklyRule } from "@/lib/listings/availability";

const monday9to12: WeeklyRule[] = [
  { dayOfWeek: 0, startMinute: 9 * 60, endMinute: 12 * 60 },
];

function localMonday(hour: number, minute: number = 0): Date {
  // Pick a far-future Monday: 2030-01-07 is a Monday.
  const d = new Date(2030, 0, 7, hour, minute, 0, 0);
  return d;
}

const NOW = new Date(2030, 0, 7, 7, 0, 0, 0);

describe("validateBookingSlot", () => {
  it("accepts a future slot inside the rule", () => {
    expect(
      validateBookingSlot({
        startsAt: localMonday(10, 0),
        endsAt: localMonday(10, 30),
        now: NOW,
        rules: monday9to12,
        blockingBookings: [],
      }),
    ).toBeNull();
  });

  it("rejects past slots", () => {
    const pastNow = new Date(2030, 0, 7, 11, 0, 0, 0);
    expect(
      validateBookingSlot({
        startsAt: localMonday(10, 0),
        endsAt: localMonday(10, 30),
        now: pastNow,
        rules: monday9to12,
        blockingBookings: [],
      }),
    ).toBe("PAST_SLOT");
  });

  it("rejects slots outside the weekly rule", () => {
    expect(
      validateBookingSlot({
        startsAt: localMonday(13, 0),
        endsAt: localMonday(13, 30),
        now: NOW,
        rules: monday9to12,
        blockingBookings: [],
      }),
    ).toBe("OUTSIDE_RULES");
  });

  it("rejects slots not aligned to granularity", () => {
    expect(
      validateBookingSlot({
        startsAt: localMonday(10, 15),
        endsAt: localMonday(10, 45),
        now: NOW,
        rules: monday9to12,
        blockingBookings: [],
      }),
    ).toBe("OUTSIDE_RULES");
  });

  it("rejects sub-granularity durations", () => {
    expect(
      validateBookingSlot({
        startsAt: localMonday(10, 0),
        endsAt: new Date(2030, 0, 7, 10, 10, 0, 0),
        now: NOW,
        rules: monday9to12,
        blockingBookings: [],
      }),
    ).toBe("BAD_GRANULARITY");
  });

  it("rejects overlapping bookings (CONFIRMED)", () => {
    expect(
      validateBookingSlot({
        startsAt: localMonday(10, 0),
        endsAt: localMonday(10, 30),
        now: NOW,
        rules: monday9to12,
        blockingBookings: [
          { startsAt: localMonday(10, 0), endsAt: localMonday(10, 30) },
        ],
      }),
    ).toBe("OVERLAP");
  });

  it("rejects partial overlap", () => {
    expect(
      validateBookingSlot({
        startsAt: localMonday(10, 0),
        endsAt: localMonday(11, 0),
        now: NOW,
        rules: monday9to12,
        blockingBookings: [
          { startsAt: localMonday(10, 30), endsAt: localMonday(11, 0) },
        ],
      }),
    ).toBe("OVERLAP");
  });

  it("rejects slot crossing midnight", () => {
    expect(
      validateBookingSlot({
        startsAt: new Date(2030, 0, 7, 23, 30, 0, 0),
        endsAt: new Date(2030, 0, 8, 0, 30, 0, 0),
        now: NOW,
        rules: monday9to12,
        blockingBookings: [],
      }),
    ).toBe("OUTSIDE_RULES");
  });
});
