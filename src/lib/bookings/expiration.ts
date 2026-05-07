import { prisma } from "@/lib/prisma";
import { getStripe } from "@/lib/stripe";
import { getBookingConfirmedNotifier } from "@/lib/notifications/booking-confirmed";

export type ExpirationResult = {
  scanned: number;
  expired: number;
  skipped: number;
};

/**
 * Expires bookings whose host did not decide within the allotted window.
 * Cancels the PaymentIntent first, then CAS-updates the row to EXPIRED.
 * If Stripe cancel fails, the booking is left untouched and the error
 * propagates so the caller can retry.
 */
export async function expireStaleRequests(
  now: Date = new Date(),
): Promise<ExpirationResult> {
  const candidates = await prisma.booking.findMany({
    where: {
      status: "PENDING_HOST_APPROVAL",
      hostDecisionDeadline: { lt: now },
    },
    include: {
      listing: { select: { id: true, title: true, hostId: true } },
      user: { select: { id: true, email: true, name: true } },
    },
  });

  let expired = 0;
  let skipped = 0;

  for (const booking of candidates) {
    if (booking.stripePaymentIntentId) {
      const stripe = getStripe();
      try {
        await stripe.paymentIntents.cancel(booking.stripePaymentIntentId);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        // Stripe replies with "already_canceled" when the PI is gone; treat as
        // success so the row can still flip to EXPIRED.
        if (!/already_canceled|already canceled/i.test(message)) {
          throw err;
        }
      }
    }

    const updated = await prisma.booking.updateMany({
      where: { id: booking.id, status: "PENDING_HOST_APPROVAL" },
      data: { status: "EXPIRED", hostDecidedAt: now },
    });
    if (updated.count === 0) {
      skipped += 1;
      continue;
    }
    expired += 1;

    try {
      await getBookingConfirmedNotifier().notifyGuestOfExpiration?.({
        bookingId: booking.id,
        listingId: booking.listing.id,
        listingTitle: booking.listing.title,
        hostId: booking.listing.hostId,
        hostEmail: "",
        guestName: booking.user.name,
        guestEmail: booking.user.email,
        startsAt: booking.startsAt,
        endsAt: booking.endsAt,
        amountCents: booking.amountCents,
        platformFeeCents: booking.platformFeeCents,
      });
    } catch (err) {
      console.error("[booking-expire] notifier failed", err);
    }
  }

  return { scanned: candidates.length, expired, skipped };
}
