import { describe, it, expect, vi, beforeEach } from "vitest";

process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
process.env.STRIPE_SECRET_KEY = "sk_test_dummy";
process.env.NEXT_PUBLIC_APP_URL = "https://test.local";

const sessionsCreate = vi.fn();

vi.mock("@/lib/user", () => ({
  getCurrentUser: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    listing: {
      findUnique: vi.fn(),
    },
    booking: {
      findMany: vi.fn(),
      update: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

vi.mock("@/lib/bookings/queries", () => ({
  getBlockingBookingsForListing: vi.fn(async () => []),
}));

vi.mock("@/lib/stripe", () => ({
  getStripe: () => ({
    checkout: { sessions: { create: sessionsCreate } },
  }),
  getAppUrl: () => "https://test.local",
}));

import { POST } from "@/app/api/bookings/instant/checkout/route";
import { getCurrentUser } from "@/lib/user";
import { prisma } from "@/lib/prisma";

const mockUser = {
  id: "user-1",
  supabaseId: "sup-1",
  email: "marco@example.com",
  name: "Marco",
  image: null,
  stripeAccountId: null,
  identityStatus: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const futureMonday = (() => {
  const d = new Date();
  d.setDate(d.getDate() + ((1 - d.getDay() + 7) % 7 || 7));
  d.setHours(10, 0, 0, 0);
  return d;
})();

const futureSlotStart = futureMonday.toISOString();
const futureSlotEnd = new Date(futureMonday.getTime() + 30 * 60_000).toISOString();

const validBody = {
  listingId: "11111111-1111-1111-1111-111111111111",
  startsAt: futureSlotStart,
  endsAt: futureSlotEnd,
};

const activeListing = {
  id: validBody.listingId,
  title: "Bagno test",
  status: "ACTIVE" as const,
  bookingMode: "INSTANT" as const,
  hourlyPriceCents: 400,
  availabilityRules: [
    { dayOfWeek: 0, startMinute: 0, endMinute: 24 * 60 },
    { dayOfWeek: 1, startMinute: 0, endMinute: 24 * 60 },
    { dayOfWeek: 2, startMinute: 0, endMinute: 24 * 60 },
    { dayOfWeek: 3, startMinute: 0, endMinute: 24 * 60 },
    { dayOfWeek: 4, startMinute: 0, endMinute: 24 * 60 },
    { dayOfWeek: 5, startMinute: 0, endMinute: 24 * 60 },
    { dayOfWeek: 6, startMinute: 0, endMinute: 24 * 60 },
  ],
};

function makeRequest(body: unknown): Request {
  return new Request("http://localhost/api/bookings/instant/checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

describe("POST /api/bookings/instant/checkout", () => {
  beforeEach(() => {
    vi.mocked(getCurrentUser).mockReset();
    vi.mocked(prisma.listing.findUnique).mockReset();
    vi.mocked(prisma.booking.update).mockReset();
    vi.mocked(prisma.$transaction).mockReset();
    sessionsCreate.mockReset();
  });

  it("returns 401 when not authenticated", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(null);
    const res = await POST(makeRequest(validBody));
    expect(res.status).toBe(401);
  });

  it("returns 404 when listing missing or not active", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(mockUser);
    vi.mocked(prisma.listing.findUnique).mockResolvedValue(null as never);
    const res = await POST(makeRequest(validBody));
    expect(res.status).toBe(404);
  });

  it("returns 422 when booking mode is not INSTANT", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(mockUser);
    vi.mocked(prisma.listing.findUnique).mockResolvedValue({
      ...activeListing,
      bookingMode: "REQUEST",
    } as never);
    const res = await POST(makeRequest(validBody));
    expect(res.status).toBe(422);
    const body = await res.json();
    expect(body.code).toBe("not_instant");
  });

  it("creates booking PENDING_PAYMENT and Stripe session", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(mockUser);
    vi.mocked(prisma.listing.findUnique).mockResolvedValue(activeListing as never);
    const createdBooking = { id: "bk-1", listingId: activeListing.id };
    vi.mocked(prisma.$transaction).mockImplementation(async (fn: unknown) => {
      const tx = {
        $executeRaw: vi.fn().mockResolvedValue(1),
        booking: {
          findMany: vi.fn().mockResolvedValue([]),
          create: vi.fn().mockResolvedValue(createdBooking),
        },
      };
      return (fn as (t: typeof tx) => Promise<typeof createdBooking>)(tx);
    });
    sessionsCreate.mockResolvedValue({
      id: "cs_test_123",
      url: "https://checkout.stripe.com/c/pay/cs_test_123",
    });
    vi.mocked(prisma.booking.update).mockResolvedValue({} as never);

    const res = await POST(makeRequest(validBody));
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.bookingId).toBe("bk-1");
    expect(body.checkoutUrl).toContain("checkout.stripe.com");

    expect(sessionsCreate).toHaveBeenCalledTimes(1);
    const callArg = sessionsCreate.mock.calls[0][0];
    expect(callArg.metadata.bookingId).toBe("bk-1");
    expect(callArg.metadata.userId).toBe(mockUser.id);
    expect(callArg.metadata.listingId).toBe(activeListing.id);
    expect(callArg.payment_intent_data).toBeUndefined();
    expect(callArg.line_items[0].price_data.unit_amount).toBe(200);
    expect(callArg.success_url).toContain("/bookings/bk-1/confirmation");
  });

  it("returns 409 when slot is taken (transaction reports overlap)", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(mockUser);
    vi.mocked(prisma.listing.findUnique).mockResolvedValue(activeListing as never);
    vi.mocked(prisma.$transaction).mockRejectedValue(new Error("SLOT_TAKEN"));

    const res = await POST(makeRequest(validBody));
    expect(res.status).toBe(409);
    const body = await res.json();
    expect(body.code).toBe("slot_unavailable");
    expect(sessionsCreate).not.toHaveBeenCalled();
  });

  it("returns 400 on invalid body", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(mockUser);
    const res = await POST(makeRequest({ listingId: "bad" }));
    expect(res.status).toBe(400);
  });
});
