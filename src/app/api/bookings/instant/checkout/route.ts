import { NextResponse } from "next/server";
import { z, ZodError } from "zod";
import { getCurrentUser } from "@/lib/user";
import { prisma } from "@/lib/prisma";
import { getStripe, getAppUrl } from "@/lib/stripe";
import { computeBookingPricing } from "@/lib/bookings/pricing";
import {
  PENDING_BOOKING_TTL_MIN,
  validateBookingSlot,
} from "@/lib/bookings/availability";
import { getBlockingBookingsForListing } from "@/lib/bookings/queries";

const inputSchema = z.object({
  listingId: z.string().uuid(),
  startsAt: z.string().datetime({ offset: true }),
  endsAt: z.string().datetime({ offset: true }),
});

const VALIDATION_TO_HTTP: Record<string, { status: number; code: string }> = {
  INVALID_RANGE: { status: 400, code: "invalid_range" },
  BAD_GRANULARITY: { status: 422, code: "bad_granularity" },
  PAST_SLOT: { status: 422, code: "past_slot" },
  OUTSIDE_RULES: { status: 422, code: "outside_rules" },
  OVERLAP: { status: 409, code: "slot_unavailable" },
};

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  let input;
  try {
    input = inputSchema.parse(body);
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json(
        { error: "Validation failed", issues: err.issues },
        { status: 400 },
      );
    }
    throw err;
  }

  const startsAt = new Date(input.startsAt);
  const endsAt = new Date(input.endsAt);

  const listing = await prisma.listing.findUnique({
    where: { id: input.listingId },
    select: {
      id: true,
      title: true,
      status: true,
      bookingMode: true,
      hourlyPriceCents: true,
      availabilityRules: {
        select: { dayOfWeek: true, startMinute: true, endMinute: true },
      },
    },
  });

  if (!listing || listing.status !== "ACTIVE") {
    return NextResponse.json({ error: "Listing not found" }, { status: 404 });
  }

  if (listing.bookingMode !== "INSTANT") {
    return NextResponse.json(
      { error: "Listing not bookable instantly", code: "not_instant" },
      { status: 422 },
    );
  }

  const now = new Date();
  const blockingBookings = await getBlockingBookingsForListing(listing.id, {
    now,
  });

  const failure = validateBookingSlot({
    startsAt,
    endsAt,
    now,
    rules: listing.availabilityRules,
    blockingBookings,
  });
  if (failure) {
    const mapped = VALIDATION_TO_HTTP[failure];
    return NextResponse.json(
      { error: failure, code: mapped.code },
      { status: mapped.status },
    );
  }

  const pricing = computeBookingPricing(
    listing.hourlyPriceCents,
    startsAt,
    endsAt,
  );

  const pendingExpiresAt = new Date(
    now.getTime() + PENDING_BOOKING_TTL_MIN * 60_000,
  );

  let booking;
  try {
    booking = await prisma.$transaction(async (tx) => {
      // Advisory lock per-listing keeps overlap checks serial across concurrent
      // requests on the same listing without locking the whole table.
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${listing.id}))`;
      const conflicts = await tx.booking.findMany({
        where: {
          listingId: listing.id,
          startsAt: { lt: endsAt },
          endsAt: { gt: startsAt },
          OR: [
            { status: "CONFIRMED" },
            {
              status: "PENDING_PAYMENT",
              pendingExpiresAt: { gt: now },
            },
          ],
        },
        select: { id: true },
      });
      if (conflicts.length > 0) {
        throw new Error("SLOT_TAKEN");
      }
      return tx.booking.create({
        data: {
          listingId: listing.id,
          userId: user.id,
          startsAt,
          endsAt,
          amountCents: pricing.amountCents,
          platformFeeCents: pricing.platformFeeCents,
          status: "PENDING_PAYMENT",
          pendingExpiresAt,
        },
      });
    });
  } catch (err) {
    if (err instanceof Error && err.message === "SLOT_TAKEN") {
      return NextResponse.json(
        { error: "OVERLAP", code: "slot_unavailable" },
        { status: 409 },
      );
    }
    throw err;
  }

  const stripe = getStripe();
  const appUrl = getAppUrl();

  let session;
  try {
    session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      customer_email: user.email,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "eur",
            unit_amount: pricing.amountCents,
            product_data: {
              name: listing.title,
              description: `Prenotazione ${startsAt.toISOString()} - ${endsAt.toISOString()}`,
            },
          },
        },
      ],
      // NOTE: application_fee_amount requires Stripe Connect (transfer_data
      // or on_behalf_of). The platform fee is tracked on the Booking row;
      // the Connect routing will be wired in US-011.
      metadata: {
        bookingId: booking.id,
        listingId: listing.id,
        userId: user.id,
      },
      success_url: `${appUrl}/bookings/${booking.id}/confirmation?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/listings/${listing.id}?checkout=cancelled`,
      expires_at: Math.floor(pendingExpiresAt.getTime() / 1000),
    });
  } catch (err) {
    // If Stripe fails the slot would stay blocked for PENDING_BOOKING_TTL.
    // Cancel the booking immediately so other guests can retry.
    await prisma.booking.update({
      where: { id: booking.id },
      data: { status: "CANCELLED", pendingExpiresAt: null },
    });
    throw err;
  }

  await prisma.booking.update({
    where: { id: booking.id },
    data: { stripeCheckoutSessionId: session.id },
  });

  return NextResponse.json(
    {
      bookingId: booking.id,
      checkoutUrl: session.url,
      sessionId: session.id,
    },
    { status: 201 },
  );
}
