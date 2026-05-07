import { prisma } from "@/lib/prisma";
import { computeBookingPricing } from "@/lib/bookings/pricing";

export class SlotTakenError extends Error {
  constructor() {
    super("SLOT_TAKEN");
    this.name = "SlotTakenError";
  }
}

export type CreatePendingBookingInput = {
  listingId: string;
  hourlyPriceCents: number;
  userId: string;
  startsAt: Date;
  endsAt: Date;
  pendingExpiresAt: Date;
  now: Date;
};

export type CreatePendingBookingResult = {
  id: string;
  amountCents: number;
  platformFeeCents: number;
};

/**
 * Creates a PENDING_PAYMENT booking inside a transaction, guarded by a
 * per-listing advisory lock and a final overlap check that mirrors
 * getBlockingBookingsForListing. Throws SlotTakenError on conflict.
 */
export async function createPendingBooking(
  input: CreatePendingBookingInput,
): Promise<CreatePendingBookingResult> {
  const pricing = computeBookingPricing(
    input.hourlyPriceCents,
    input.startsAt,
    input.endsAt,
  );

  return prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${input.listingId}))`;
    const conflicts = await tx.booking.findMany({
      where: {
        listingId: input.listingId,
        startsAt: { lt: input.endsAt },
        endsAt: { gt: input.startsAt },
        OR: [
          { status: "CONFIRMED" },
          {
            status: "PENDING_PAYMENT",
            pendingExpiresAt: { gt: input.now },
          },
          {
            status: "PENDING_HOST_APPROVAL",
            hostDecisionDeadline: { gt: input.now },
          },
        ],
      },
      select: { id: true },
    });
    if (conflicts.length > 0) throw new SlotTakenError();
    const created = await tx.booking.create({
      data: {
        listingId: input.listingId,
        userId: input.userId,
        startsAt: input.startsAt,
        endsAt: input.endsAt,
        amountCents: pricing.amountCents,
        platformFeeCents: pricing.platformFeeCents,
        status: "PENDING_PAYMENT",
        pendingExpiresAt: input.pendingExpiresAt,
      },
    });
    return {
      id: created.id,
      amountCents: pricing.amountCents,
      platformFeeCents: pricing.platformFeeCents,
    };
  });
}
