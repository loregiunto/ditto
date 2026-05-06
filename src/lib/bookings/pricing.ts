export const PLATFORM_FEE_BPS = 1000;
export const MS_PER_MINUTE = 60_000;

export type BookingPricing = {
  durationMinutes: number;
  amountCents: number;
  platformFeeCents: number;
  hostNetCents: number;
};

export function computeDurationMinutes(startsAt: Date, endsAt: Date): number {
  const diffMs = endsAt.getTime() - startsAt.getTime();
  if (diffMs <= 0) {
    throw new Error("endsAt must be strictly after startsAt");
  }
  if (diffMs % MS_PER_MINUTE !== 0) {
    throw new Error("booking duration must be a whole number of minutes");
  }
  return diffMs / MS_PER_MINUTE;
}

export function computeAmountCents(
  hourlyPriceCents: number,
  durationMinutes: number,
): number {
  if (!Number.isInteger(hourlyPriceCents) || hourlyPriceCents <= 0) {
    throw new Error("hourlyPriceCents must be a positive integer");
  }
  if (!Number.isInteger(durationMinutes) || durationMinutes <= 0) {
    throw new Error("durationMinutes must be a positive integer");
  }
  return Math.round((hourlyPriceCents * durationMinutes) / 60);
}

export function computePlatformFeeCents(amountCents: number): number {
  return Math.round((amountCents * PLATFORM_FEE_BPS) / 10_000);
}

export function computeBookingPricing(
  hourlyPriceCents: number,
  startsAt: Date,
  endsAt: Date,
): BookingPricing {
  const durationMinutes = computeDurationMinutes(startsAt, endsAt);
  const amountCents = computeAmountCents(hourlyPriceCents, durationMinutes);
  const platformFeeCents = computePlatformFeeCents(amountCents);
  return {
    durationMinutes,
    amountCents,
    platformFeeCents,
    hostNetCents: amountCents - platformFeeCents,
  };
}
