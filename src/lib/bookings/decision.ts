import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getStripe } from "@/lib/stripe";
import { getBookingConfirmedNotifier } from "@/lib/notifications/booking-confirmed";

export type DecisionAction = "approve" | "reject";

export type DecisionOutcome =
  | { kind: "ok"; status: "CONFIRMED" | "REJECTED" }
  | { kind: "already_decided" }
  | { kind: "not_found" }
  | { kind: "forbidden" }
  | { kind: "invalid_status" }
  | { kind: "deadline_expired" };

/**
 * Approve or reject a PENDING_HOST_APPROVAL booking.
 *
 * Concurrency: the DB CAS update happens BEFORE the Stripe capture/cancel
 * call. Only the request that wins the CAS calls Stripe; concurrent calls
 * see count=0 and short-circuit as `already_decided`. This prevents both
 * double-capture and an approve+reject crossover on the same PaymentIntent.
 */
export async function decideBooking(args: {
  action: DecisionAction;
  bookingId: string;
  hostUserId: string;
  hostEmail: string;
}): Promise<DecisionOutcome> {
  const booking = await prisma.booking.findUnique({
    where: { id: args.bookingId },
    include: {
      listing: {
        select: { id: true, title: true, hostId: true, addressFull: true },
      },
      user: { select: { id: true, email: true, name: true } },
    },
  });
  if (!booking) return { kind: "not_found" };
  if (booking.listing.hostId !== args.hostUserId) return { kind: "forbidden" };

  const targetStatus = args.action === "approve" ? "CONFIRMED" : "REJECTED";

  if (booking.status === targetStatus) return { kind: "already_decided" };
  if (booking.status !== "PENDING_HOST_APPROVAL") {
    return { kind: "invalid_status" };
  }

  const now = new Date();
  if (
    booking.hostDecisionDeadline &&
    booking.hostDecisionDeadline.getTime() <= now.getTime()
  ) {
    return { kind: "deadline_expired" };
  }

  // CAS first: claim the decision atomically before touching Stripe so that
  // concurrent approve/reject calls cannot both reach the gateway.
  const claimed = await prisma.booking.updateMany({
    where: { id: booking.id, status: "PENDING_HOST_APPROVAL" },
    data:
      args.action === "approve"
        ? { status: "CONFIRMED", confirmedAt: now, hostDecidedAt: now }
        : { status: "REJECTED", hostDecidedAt: now },
  });
  if (claimed.count === 0) return { kind: "already_decided" };

  if (booking.stripePaymentIntentId) {
    const stripe = getStripe();
    try {
      if (args.action === "approve") {
        await stripe.paymentIntents.capture(booking.stripePaymentIntentId);
      } else {
        await stripe.paymentIntents.cancel(booking.stripePaymentIntentId);
      }
    } catch (err) {
      // CAS already committed: leave the row in its decided state and log.
      // For approve a stuck PI surfaces in monitoring; for reject Stripe
      // expires the manual-capture PI within 7 days regardless.
      console.error(
        `[booking-${args.action}] Stripe call failed for booking ${booking.id}`,
        err,
      );
    }
  }

  revalidatePath("/host/requests");
  revalidatePath(`/bookings/${booking.id}/confirmation`);
  revalidatePath(`/listings/${booking.listing.id}`);

  const notifier = getBookingConfirmedNotifier();
  const payload = {
    bookingId: booking.id,
    listingId: booking.listing.id,
    listingTitle: booking.listing.title,
    hostId: booking.listing.hostId,
    hostEmail: args.hostEmail,
    guestName: booking.user.name,
    guestEmail: booking.user.email,
    startsAt: booking.startsAt,
    endsAt: booking.endsAt,
    amountCents: booking.amountCents,
    platformFeeCents: booking.platformFeeCents,
  };
  try {
    if (args.action === "approve") {
      await notifier.notifyGuestOfApproval?.({
        ...payload,
        addressFull: booking.listing.addressFull,
      });
    } else {
      await notifier.notifyGuestOfRejection?.(payload);
    }
  } catch (err) {
    console.error(`[booking-${args.action}] notifier failed`, err);
  }

  return { kind: "ok", status: targetStatus };
}
