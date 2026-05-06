import { SLOT_GRANULARITY_MIN } from "@/lib/validation/availability";
import type { WeeklyRule, BookingInterval } from "@/lib/listings/availability";

export const PENDING_BOOKING_TTL_MIN = 15;

export type ValidationFailure =
  | "INVALID_RANGE"
  | "BAD_GRANULARITY"
  | "PAST_SLOT"
  | "OUTSIDE_RULES"
  | "OVERLAP";

function jsDayToOurDay(jsDay: number): number {
  return (jsDay + 6) % 7;
}

function minutesFromMidnight(date: Date): number {
  return date.getHours() * 60 + date.getMinutes();
}

function sameLocalDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function isWithinWeeklyRules(
  startsAt: Date,
  endsAt: Date,
  rules: WeeklyRule[],
  granularityMin: number = SLOT_GRANULARITY_MIN,
): boolean {
  if (!sameLocalDay(startsAt, endsAt)) return false;
  const day = jsDayToOurDay(startsAt.getDay());
  const startMin = minutesFromMidnight(startsAt);
  const durationMin = (endsAt.getTime() - startsAt.getTime()) / 60_000;
  const endMin = startMin + durationMin;
  if (startMin % granularityMin !== 0) return false;
  return rules.some(
    (rule) =>
      rule.dayOfWeek === day &&
      startMin >= rule.startMinute &&
      endMin <= rule.endMinute,
  );
}

export function overlapsBookings(
  startsAt: Date,
  endsAt: Date,
  bookings: BookingInterval[],
): boolean {
  return bookings.some((b) => startsAt < b.endsAt && endsAt > b.startsAt);
}

export function validateBookingSlot(params: {
  startsAt: Date;
  endsAt: Date;
  now: Date;
  rules: WeeklyRule[];
  blockingBookings: BookingInterval[];
  granularityMin?: number;
}): ValidationFailure | null {
  const {
    startsAt,
    endsAt,
    now,
    rules,
    blockingBookings,
    granularityMin = SLOT_GRANULARITY_MIN,
  } = params;

  if (!(startsAt instanceof Date) || !(endsAt instanceof Date)) {
    return "INVALID_RANGE";
  }
  if (Number.isNaN(startsAt.getTime()) || Number.isNaN(endsAt.getTime())) {
    return "INVALID_RANGE";
  }
  const diffMs = endsAt.getTime() - startsAt.getTime();
  if (diffMs <= 0) return "INVALID_RANGE";
  if (diffMs % (granularityMin * 60_000) !== 0) return "BAD_GRANULARITY";
  if (startsAt <= now) return "PAST_SLOT";
  if (!isWithinWeeklyRules(startsAt, endsAt, rules, granularityMin)) {
    return "OUTSIDE_RULES";
  }
  if (overlapsBookings(startsAt, endsAt, blockingBookings)) return "OVERLAP";
  return null;
}
