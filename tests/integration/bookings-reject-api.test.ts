import { describe, it, expect, vi, beforeEach } from "vitest";

process.env.STRIPE_SECRET_KEY = "sk_test_dummy";

const cancel = vi.fn();

vi.mock("@/lib/user", () => ({ getCurrentUser: vi.fn() }));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    booking: { findUnique: vi.fn(), updateMany: vi.fn() },
  },
}));

vi.mock("@/lib/stripe", () => ({
  getStripe: () => ({ paymentIntents: { cancel } }),
}));

const notifyGuestOfRejection = vi.fn();
vi.mock("@/lib/notifications/booking-confirmed", () => ({
  getBookingConfirmedNotifier: () => ({ notifyGuestOfRejection }),
}));

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

import { POST } from "@/app/api/bookings/[id]/reject/route";
import { getCurrentUser } from "@/lib/user";
import { prisma } from "@/lib/prisma";

const host = {
  id: "host-1",
  supabaseId: "s",
  email: "sara@example.com",
  name: "Sara",
  image: null,
  stripeAccountId: null,
  identityStatus: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const baseBooking = {
  id: "bk-1",
  status: "PENDING_HOST_APPROVAL" as const,
  stripePaymentIntentId: "pi_1",
  hostDecisionDeadline: new Date(Date.now() + 25 * 60_000),
  amountCents: 600,
  platformFeeCents: 60,
  startsAt: new Date("2030-01-07T10:00:00Z"),
  endsAt: new Date("2030-01-07T10:30:00Z"),
  listing: { id: "list-1", title: "Bagno", hostId: "host-1" },
  user: { id: "guest-1", email: "marco@example.com", name: "Marco" },
};

function call() {
  return POST(new Request("http://localhost"), { params: Promise.resolve({ id: "bk-1" }) });
}

describe("POST /api/bookings/[id]/reject", () => {
  beforeEach(() => {
    vi.mocked(getCurrentUser).mockReset();
    vi.mocked(prisma.booking.findUnique).mockReset();
    vi.mocked(prisma.booking.updateMany).mockReset();
    cancel.mockReset();
    notifyGuestOfRejection.mockReset();
  });

  it("403 when not the host", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({ ...host, id: "other" });
    vi.mocked(prisma.booking.findUnique).mockResolvedValue(baseBooking as never);
    expect((await call()).status).toBe(403);
  });

  it("cancels PI, sets REJECTED and notifies guest", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(host);
    vi.mocked(prisma.booking.findUnique).mockResolvedValue(baseBooking as never);
    vi.mocked(prisma.booking.updateMany).mockResolvedValue({ count: 1 } as never);
    cancel.mockResolvedValue({});

    const res = await call();
    expect(res.status).toBe(200);
    expect(cancel).toHaveBeenCalledWith("pi_1");
    const args = vi.mocked(prisma.booking.updateMany).mock.calls[0]![0]!;
    expect(args.data).toMatchObject({ status: "REJECTED" });
    expect(notifyGuestOfRejection).toHaveBeenCalledTimes(1);
  });

  it("idempotent on CAS conflict", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(host);
    vi.mocked(prisma.booking.findUnique).mockResolvedValue(baseBooking as never);
    vi.mocked(prisma.booking.updateMany).mockResolvedValue({ count: 0 } as never);
    cancel.mockResolvedValue({});
    const res = await call();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.alreadyRejected).toBe(true);
    expect(notifyGuestOfRejection).not.toHaveBeenCalled();
  });
});
