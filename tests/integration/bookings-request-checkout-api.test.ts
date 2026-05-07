import { describe, it, expect, vi, beforeEach } from "vitest";

process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
process.env.STRIPE_SECRET_KEY = "sk_test_dummy";
process.env.NEXT_PUBLIC_APP_URL = "https://test.local";

const sessionsCreate = vi.fn();

vi.mock("@/lib/user", () => ({ getCurrentUser: vi.fn() }));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    listing: { findUnique: vi.fn() },
    booking: { update: vi.fn() },
  },
}));

vi.mock("@/lib/bookings/queries", () => ({
  getBlockingBookingsForListing: vi.fn(async () => []),
}));

vi.mock("@/lib/bookings/checkout", async () => {
  const actual = await vi.importActual<typeof import("@/lib/bookings/checkout")>(
    "@/lib/bookings/checkout",
  );
  return {
    ...actual,
    createPendingBooking: vi.fn(),
  };
});

vi.mock("@/lib/stripe", () => ({
  getStripe: () => ({
    checkout: { sessions: { create: sessionsCreate } },
  }),
  getAppUrl: () => "https://test.local",
}));

import { POST } from "@/app/api/bookings/request/checkout/route";
import { getCurrentUser } from "@/lib/user";
import { prisma } from "@/lib/prisma";
import { createPendingBooking, SlotTakenError } from "@/lib/bookings/checkout";

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

const startsAt = futureMonday.toISOString();
const endsAt = new Date(futureMonday.getTime() + 30 * 60_000).toISOString();
const validBody = {
  listingId: "11111111-1111-1111-1111-111111111111",
  startsAt,
  endsAt,
};

const requestListing = {
  id: validBody.listingId,
  title: "Bagno Sara",
  status: "ACTIVE" as const,
  bookingMode: "REQUEST" as const,
  hourlyPriceCents: 600,
  availabilityRules: Array.from({ length: 7 }, (_, dayOfWeek) => ({
    dayOfWeek,
    startMinute: 0,
    endMinute: 24 * 60,
  })),
};

function makeRequest(body: unknown): Request {
  return new Request("http://localhost/api/bookings/request/checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

describe("POST /api/bookings/request/checkout", () => {
  beforeEach(() => {
    vi.mocked(getCurrentUser).mockReset();
    vi.mocked(prisma.listing.findUnique).mockReset();
    vi.mocked(prisma.booking.update).mockReset();
    vi.mocked(createPendingBooking).mockReset();
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
    expect((await POST(makeRequest(validBody))).status).toBe(404);
  });

  it("returns 422 when listing is INSTANT", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(mockUser);
    vi.mocked(prisma.listing.findUnique).mockResolvedValue({
      ...requestListing,
      bookingMode: "INSTANT",
    } as never);
    const res = await POST(makeRequest(validBody));
    expect(res.status).toBe(422);
    const body = await res.json();
    expect(body.code).toBe("not_request");
  });

  it("returns 409 when slot is taken", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(mockUser);
    vi.mocked(prisma.listing.findUnique).mockResolvedValue(requestListing as never);
    vi.mocked(createPendingBooking).mockRejectedValue(new SlotTakenError());
    const res = await POST(makeRequest(validBody));
    expect(res.status).toBe(409);
    const body = await res.json();
    expect(body.code).toBe("slot_unavailable");
  });

  it("creates a pending booking and a manual-capture Checkout Session", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(mockUser);
    vi.mocked(prisma.listing.findUnique).mockResolvedValue(requestListing as never);
    vi.mocked(createPendingBooking).mockResolvedValue({
      id: "bk-req-1",
      amountCents: 600,
      platformFeeCents: 60,
    });
    sessionsCreate.mockResolvedValue({ id: "cs_1", url: "https://stripe/cs_1" } as never);
    vi.mocked(prisma.booking.update).mockResolvedValue({} as never);

    const res = await POST(makeRequest(validBody));
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.bookingId).toBe("bk-req-1");
    expect(body.checkoutUrl).toBe("https://stripe/cs_1");

    expect(sessionsCreate).toHaveBeenCalledTimes(1);
    const args = sessionsCreate.mock.calls[0]![0]!;
    expect(args.payment_intent_data).toEqual({ capture_method: "manual" });
    expect(args.metadata).toMatchObject({
      bookingId: "bk-req-1",
      listingId: validBody.listingId,
      userId: "user-1",
      bookingMode: "REQUEST",
    });
    expect(args.line_items[0].price_data.unit_amount).toBe(600);
  });
});
