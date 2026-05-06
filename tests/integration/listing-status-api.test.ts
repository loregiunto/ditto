import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/user", () => ({
  getCurrentUser: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    listing: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

import { PATCH } from "@/app/api/listings/[id]/status/route";
import { getCurrentUser } from "@/lib/user";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

const baseUser = {
  id: "host-1",
  supabaseId: "supa-1",
  email: "host@example.com",
  name: null,
  image: null,
  stripeAccountId: null as string | null,
  identityStatus: null as string | null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const verifiedUser = {
  ...baseUser,
  stripeAccountId: "acct_123",
  identityStatus: "verified",
};

const ownListing = {
  id: "listing-1",
  hostId: "host-1",
  status: "DRAFT" as const,
};

const otherListing = {
  id: "listing-2",
  hostId: "host-other",
  status: "DRAFT" as const,
};

function makeRequest(body: unknown): Request {
  return new Request("http://localhost/api/listings/listing-1/status", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

const params = Promise.resolve({ id: "listing-1" });

describe("PATCH /api/listings/[id]/status", () => {
  beforeEach(() => {
    vi.mocked(getCurrentUser).mockReset();
    vi.mocked(prisma.listing.findUnique).mockReset();
    vi.mocked(prisma.listing.update).mockReset();
    vi.mocked(revalidatePath).mockReset();
  });

  it("returns 401 when not authenticated", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(null);
    const res = await PATCH(makeRequest({ status: "active" }), { params });
    expect(res.status).toBe(401);
  });

  it("returns 400 on invalid JSON", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(verifiedUser);
    const res = await PATCH(makeRequest("not-json{"), { params });
    expect(res.status).toBe(400);
  });

  it("returns 400 on empty body", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(verifiedUser);
    const res = await PATCH(makeRequest({}), { params });
    expect(res.status).toBe(400);
  });

  it("returns 400 on invalid status value", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(verifiedUser);
    const res = await PATCH(makeRequest({ status: "DRAFT" }), { params });
    expect(res.status).toBe(400);
  });

  it("returns 400 on extra fields (strict)", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(verifiedUser);
    const res = await PATCH(
      makeRequest({ status: "active", extra: 1 }),
      { params },
    );
    expect(res.status).toBe(400);
  });

  it("returns 404 when listing belongs to another host", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(verifiedUser);
    vi.mocked(prisma.listing.findUnique).mockResolvedValue(
      otherListing as Awaited<ReturnType<typeof prisma.listing.findUnique>>,
    );
    const res = await PATCH(makeRequest({ status: "active" }), { params });
    expect(res.status).toBe(404);
  });

  it("returns 404 when listing does not exist", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(verifiedUser);
    vi.mocked(prisma.listing.findUnique).mockResolvedValue(null);
    const res = await PATCH(makeRequest({ status: "active" }), { params });
    expect(res.status).toBe(404);
  });

  it("returns 422 with STRIPE_NOT_CONNECTED when activating without Stripe", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(baseUser);
    vi.mocked(prisma.listing.findUnique).mockResolvedValue(
      ownListing as Awaited<ReturnType<typeof prisma.listing.findUnique>>,
    );
    const res = await PATCH(makeRequest({ status: "active" }), { params });
    expect(res.status).toBe(422);
    const data = await res.json();
    expect(data.reason).toBe("STRIPE_NOT_CONNECTED");
    expect(prisma.listing.update).not.toHaveBeenCalled();
  });

  it("returns 422 with IDENTITY_NOT_VERIFIED when identity not verified", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({
      ...baseUser,
      stripeAccountId: "acct_123",
    });
    vi.mocked(prisma.listing.findUnique).mockResolvedValue(
      ownListing as Awaited<ReturnType<typeof prisma.listing.findUnique>>,
    );
    const res = await PATCH(makeRequest({ status: "active" }), { params });
    expect(res.status).toBe(422);
    const data = await res.json();
    expect(data.reason).toBe("IDENTITY_NOT_VERIFIED");
  });

  it("activates listing on happy path DRAFT → ACTIVE and revalidates paths", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(verifiedUser);
    vi.mocked(prisma.listing.findUnique).mockResolvedValue(
      ownListing as Awaited<ReturnType<typeof prisma.listing.findUnique>>,
    );
    vi.mocked(prisma.listing.update).mockResolvedValue({
      id: "listing-1",
      status: "ACTIVE",
    } as Awaited<ReturnType<typeof prisma.listing.update>>);

    const res = await PATCH(makeRequest({ status: "active" }), { params });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.status).toBe("ACTIVE");

    const arg = vi.mocked(prisma.listing.update).mock.calls[0][0];
    expect(arg.where).toEqual({ id: "listing-1" });
    expect(arg.data).toEqual({ status: "ACTIVE" });

    expect(revalidatePath).toHaveBeenCalledWith("/host/dashboard");
    expect(revalidatePath).toHaveBeenCalledWith("/");
  });

  it("deactivates listing without checking gate (ACTIVE → INACTIVE)", async () => {
    // user without gate fields can still deactivate
    vi.mocked(getCurrentUser).mockResolvedValue(baseUser);
    vi.mocked(prisma.listing.findUnique).mockResolvedValue({
      ...ownListing,
      status: "ACTIVE",
    } as Awaited<ReturnType<typeof prisma.listing.findUnique>>);
    vi.mocked(prisma.listing.update).mockResolvedValue({
      id: "listing-1",
      status: "INACTIVE",
    } as Awaited<ReturnType<typeof prisma.listing.update>>);

    const res = await PATCH(makeRequest({ status: "inactive" }), { params });
    expect(res.status).toBe(200);
    const arg = vi.mocked(prisma.listing.update).mock.calls[0][0];
    expect(arg.data).toEqual({ status: "INACTIVE" });
    expect(revalidatePath).toHaveBeenCalledWith("/host/dashboard");
    expect(revalidatePath).toHaveBeenCalledWith("/");
  });

  it("re-activates INACTIVE → ACTIVE when gate is satisfied", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(verifiedUser);
    vi.mocked(prisma.listing.findUnique).mockResolvedValue({
      ...ownListing,
      status: "INACTIVE",
    } as Awaited<ReturnType<typeof prisma.listing.findUnique>>);
    vi.mocked(prisma.listing.update).mockResolvedValue({
      id: "listing-1",
      status: "ACTIVE",
    } as Awaited<ReturnType<typeof prisma.listing.update>>);

    const res = await PATCH(makeRequest({ status: "active" }), { params });
    expect(res.status).toBe(200);
    expect(revalidatePath).toHaveBeenCalledWith("/host/dashboard");
    expect(revalidatePath).toHaveBeenCalledWith("/");
  });
});
