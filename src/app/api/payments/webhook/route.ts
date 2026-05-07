import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getStripe, getStripeWebhookSecret } from "@/lib/stripe";
import { getBookingConfirmedNotifier } from "@/lib/notifications/booking-confirmed";
import type Stripe from "stripe";

export const dynamic = "force-dynamic";

export const HOST_DECISION_WINDOW_MIN = 30;

export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  const rawBody = await request.text();
  const stripe = getStripe();
  const secret = getStripeWebhookSecret();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, secret);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid signature";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const existing = await prisma.stripeEvent.findUnique({
    where: { id: event.id },
  });
  if (existing) {
    return NextResponse.json({ received: true, duplicate: true });
  }

  if (event.type !== "checkout.session.completed") {
    try {
      await prisma.stripeEvent.create({
        data: { id: event.id, type: event.type },
      });
    } catch {
      // race with concurrent retry: ignore
    }
    return NextResponse.json({ received: true, ignored: true });
  }

  const session = event.data.object as Stripe.Checkout.Session;
  const bookingId = session.metadata?.bookingId;
  if (!bookingId) {
    return NextResponse.json(
      { error: "Missing bookingId metadata" },
      { status: 400 },
    );
  }

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      listing: {
        select: { id: true, title: true, hostId: true, bookingMode: true },
      },
      user: { select: { id: true, email: true, name: true } },
    },
  });
  if (!booking) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }

  // Already-progressed bookings: just record the event so Stripe stops retrying.
  if (
    booking.status === "CONFIRMED" ||
    booking.status === "PENDING_HOST_APPROVAL"
  ) {
    try {
      await prisma.stripeEvent.create({
        data: { id: event.id, type: event.type },
      });
    } catch {
      // ignore race
    }
    return NextResponse.json({
      received: true,
      alreadyProcessed: true,
      status: booking.status,
    });
  }

  const paymentIntentId =
    typeof session.payment_intent === "string"
      ? session.payment_intent
      : (session.payment_intent?.id ?? null);

  const isRequest = booking.listing.bookingMode === "REQUEST";
  const now = new Date();
  const hostDecisionDeadline = isRequest
    ? new Date(now.getTime() + HOST_DECISION_WINDOW_MIN * 60_000)
    : null;

  try {
    await prisma.$transaction([
      prisma.stripeEvent.create({
        data: { id: event.id, type: event.type },
      }),
      prisma.booking.update({
        where: { id: booking.id },
        data: isRequest
          ? {
              status: "PENDING_HOST_APPROVAL",
              stripePaymentIntentId: paymentIntentId,
              stripeCheckoutSessionId: session.id,
              hostDecisionDeadline,
            }
          : {
              status: "CONFIRMED",
              stripePaymentIntentId: paymentIntentId,
              stripeCheckoutSessionId: session.id,
              confirmedAt: now,
            },
      }),
    ]);
  } catch (err) {
    const recheck = await prisma.stripeEvent.findUnique({
      where: { id: event.id },
    });
    if (recheck) {
      return NextResponse.json({ received: true, duplicate: true });
    }
    throw err;
  }

  revalidatePath(`/listings/${booking.listing.id}`);
  revalidatePath("/");

  const host = await prisma.user.findUnique({
    where: { id: booking.listing.hostId },
    select: { id: true, email: true },
  });

  if (host) {
    const notifier = getBookingConfirmedNotifier();
    const basePayload = {
      bookingId: booking.id,
      listingId: booking.listing.id,
      listingTitle: booking.listing.title,
      hostId: host.id,
      hostEmail: host.email,
      guestName: booking.user.name,
      guestEmail: booking.user.email,
      startsAt: booking.startsAt,
      endsAt: booking.endsAt,
      amountCents: booking.amountCents,
      platformFeeCents: booking.platformFeeCents,
    };
    try {
      if (isRequest) {
        await notifier.notifyHostOfRequest?.({
          ...basePayload,
          hostDecisionDeadline: hostDecisionDeadline!,
        });
      } else {
        await notifier.notifyHost(basePayload);
      }
    } catch (err) {
      console.error("[booking-webhook] notifier failed", err);
    }
  }

  return NextResponse.json({
    received: true,
    bookingId: booking.id,
    status: isRequest ? "PENDING_HOST_APPROVAL" : "CONFIRMED",
  });
}
