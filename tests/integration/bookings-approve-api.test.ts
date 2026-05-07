import { describe, it, expect, vi, beforeEach } from "vitest";

process.env.STRIPE_SECRET_KEY = "sk_test_dummy";

const capture = vi.fn();

vi.mock("@/lib/user", () => ({ getCurrentUser: vi.fn() }));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    booking: { findUnique: vi.fn(), updateMany: vi.fn() },
  },
}));

vi.mock("@/lib/stripe", () => ({
  getStripe: () => ({ paymentIntents: { capture } }),
}));

const notifyGuestOfApproval = vi.fn();
vi.mock("@/lib/notifications/booking-confirmed", () => ({
  getBookingConfirmedNotifier: () => ({ notifyGuestOfApproval }),
}));

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

import { POST } from "@/app/api/bookings/[id]/approve/route";
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

const futureDeadline = new Date(Date.now() + 25 * 60_000);
const pastDeadline = new Date(Date.now() - 5 * 60_000);

const baseBooking = {
  id: "bk-1",
  status: "PENDING_HOST_APPROVAL" as const,
  stripePaymentIntentId: "pi_1",
  hostDecisionDeadline: futureDeadline,
  amountCents: 600,
  platformFeeCents: 60,
  startsAt: new Date("2030-01-07T10:00:00Z"),
  endsAt: new Date("2030-01-07T10:30:00Z"),
  listing: {
    id: "list-1",
    title: "Bagno",
    hostId: "host-1",
    addressFull: "Via Lambro 12, Milano",
  },
  user: { id: "guest-1", email: "marco@example.com", name: "Marco" },
};

function call(id = "bk-1") {
  return POST(new Request("http://localhost"), { params: Promise.resolve({ id }) });
}

describe("POST /api/bookings/[id]/approve", () => {
  beforeEach(() => {
    vi.mocked(getCurrentUser).mockReset();
    vi.mocked(prisma.booking.findUnique).mockReset();
    vi.mocked(prisma.booking.updateMany).mockReset();
    capture.mockReset();
    notifyGuestOfApproval.mockReset();
  });

  it("401 when unauthenticated", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(null);
    expect((await call()).status).toBe(401);
  });

  it("403 when not the listing host", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({ ...host, id: "other" });
    vi.mocked(prisma.booking.findUnique).mockResolvedValue(baseBooking as never);
    expect((await call()).status).toBe(403);
  });

  it("404 when booking missing", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(host);
    vi.mocked(prisma.booking.findUnique).mockResolvedValue(null);
    expect((await call()).status).toBe(404);
  });

  it("409 when status not PENDING_HOST_APPROVAL", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(host);
    vi.mocked(prisma.booking.findUnique).mockResolvedValue({
      ...baseBooking,
      status: "PENDING_PAYMENT",
    } as never);
    expect((await call()).status).toBe(409);
  });

  it("410 when deadline expired", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(host);
    vi.mocked(prisma.booking.findUnique).mockResolvedValue({
      ...baseBooking,
      hostDecisionDeadline: pastDeadline,
    } as never);
    expect((await call()).status).toBe(410);
  });

  it("captures PI, flips to CONFIRMED, notifies guest with address", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(host);
    vi.mocked(prisma.booking.findUnique).mockResolvedValue(baseBooking as never);
    vi.mocked(prisma.booking.updateMany).mockResolvedValue({ count: 1 } as never);
    capture.mockResolvedValue({});

    const res = await call();
    expect(res.status).toBe(200);
    expect(capture).toHaveBeenCalledWith("pi_1");
    const updateArgs = vi.mocked(prisma.booking.updateMany).mock.calls[0]![0]!;
    expect(updateArgs.where).toMatchObject({ id: "bk-1", status: "PENDING_HOST_APPROVAL" });
    expect(updateArgs.data).toMatchObject({ status: "CONFIRMED" });
    expect(notifyGuestOfApproval).toHaveBeenCalledTimes(1);
    const payload = notifyGuestOfApproval.mock.calls[0]![0];
    expect(payload.addressFull).toBe("Via Lambro 12, Milano");
  });

  it("double-click is idempotent (CAS no-op)", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(host);
    vi.mocked(prisma.booking.findUnique).mockResolvedValue(baseBooking as never);
    vi.mocked(prisma.booking.updateMany).mockResolvedValue({ count: 0 } as never);
    capture.mockResolvedValue({});
    const res = await call();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.alreadyConfirmed).toBe(true);
    expect(notifyGuestOfApproval).not.toHaveBeenCalled();
  });
});
