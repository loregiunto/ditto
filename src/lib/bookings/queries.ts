import { prisma } from "@/lib/prisma";
import type { BookingInterval } from "@/lib/listings/availability";

export async function getBlockingBookingsForListing(
  listingId: string,
  options: { from?: Date; to?: Date; now?: Date } = {},
): Promise<BookingInterval[]> {
  const now = options.now ?? new Date();
  const where = {
    listingId,
    OR: [
      { status: "CONFIRMED" as const },
      {
        status: "PENDING_PAYMENT" as const,
        pendingExpiresAt: { gt: now },
      },
      {
        status: "PENDING_HOST_APPROVAL" as const,
        hostDecisionDeadline: { gt: now },
      },
    ],
    ...(options.from ? { endsAt: { gt: options.from } } : {}),
    ...(options.to ? { startsAt: { lt: options.to } } : {}),
  };
  const bookings = await prisma.booking.findMany({
    where,
    select: { startsAt: true, endsAt: true },
  });
  return bookings.map((b) => ({ startsAt: b.startsAt, endsAt: b.endsAt }));
}
