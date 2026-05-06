import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createElement, type ReactElement } from "react";
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import path from "node:path";
import ts from "typescript";
import * as availability from "@/lib/listings/availability";
import * as detail from "@/lib/listings/detail";

const { notFoundMock } = vi.hoisted(() => ({
  notFoundMock: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
}));

vi.mock("next/navigation", () => ({
  notFound: notFoundMock,
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    listing: {
      findUnique: vi.fn(),
    },
  },
}));

vi.mock("@/lib/user", () => ({
  getCurrentUser: vi.fn(),
}));

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/user";

type ListingDetailPageModule = {
  default: (props: {
    params: Promise<{ id: string }>;
  }) => Promise<ReactElement>;
};

type ListingRow = {
  id: string;
  title: string;
  description: string;
  addressFull: string;
  addressDisplay: string;
  latitude: number;
  longitude: number;
  hourlyPriceCents: number;
  hostType: "PRIVATE" | "BUSINESS";
  bookingMode: "INSTANT" | "REQUEST";
  status: "DRAFT" | "ACTIVE" | "INACTIVE";
  host: {
    name: string | null;
    image: string | null;
    identityStatus: string | null;
  };
  photos: { id: string; url: string; order: number }[];
  availabilityRules: {
    dayOfWeek: number;
    startMinute: number;
    endMinute: number;
  }[];
};

const SECRET_ADDRESS = "Via Privata Nascosta 7, Trastevere, Roma";

const authenticatedUser = {
  id: "user-1",
  supabaseId: "supa-1",
  email: "guest@example.com",
  name: "Guest",
  image: null,
  stripeAccountId: null,
  identityStatus: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

function makeListing(overrides: Partial<ListingRow> = {}): ListingRow {
  const { host: hostOverride, photos, availabilityRules, ...rest } = overrides;
  return {
    id: "listing-1",
    title: "Bagno del Cortile",
    description: "Bagno pulito, accessibile e ben illuminato.",
    addressFull: SECRET_ADDRESS,
    addressDisplay: "Trastevere",
    latitude: 41.889,
    longitude: 12.469,
    hourlyPriceCents: 350,
    hostType: "PRIVATE",
    bookingMode: "INSTANT",
    status: "ACTIVE",
    ...rest,
    host: {
      name: "Marco",
      image: null,
      identityStatus: "verified",
      ...hostOverride,
    },
    photos: photos ?? [
      { id: "p1", url: "https://cdn.example.com/second.jpg", order: 1 },
      { id: "p0", url: "https://cdn.example.com/cover.jpg", order: 0 },
    ],
    availabilityRules: availabilityRules ?? [
      { dayOfWeek: 0, startMinute: 9 * 60, endMinute: 10 * 60 },
    ],
  };
}

const nodeRequire = createRequire(import.meta.url);

function ListingDetailMock(props: {
  listing: detail.PublicListingDetail;
  slotDays: detail.PublicSlotDay[];
  isAuthenticated: boolean;
  signInHref: string;
}) {
  return createElement(
    "main",
    { "data-testid": "listing-detail-page" },
    createElement("h1", null, props.listing.title),
    createElement("p", null, props.listing.description),
    createElement("p", null, props.listing.addressDisplay),
    createElement("p", null, props.listing.hostType === "PRIVATE" ? "Privato" : "Attivita Commerciale"),
    props.listing.badges.verified
      ? createElement("p", null, "Verificato")
      : null,
    props.listing.badges.superHost
      ? createElement("p", null, "Super Host")
      : null,
    createElement(
      "p",
      null,
      props.listing.bookingMode === "INSTANT"
        ? "Conferma istantanea"
        : "Su richiesta",
    ),
    props.isAuthenticated
      ? createElement(
          "button",
          { disabled: true, title: "Disponibile a breve" },
          "Prenota ora",
        )
      : createElement("a", { href: props.signInHref }, "Accedi per prenotare"),
    createElement("pre", null, JSON.stringify(props.listing)),
    createElement("pre", null, JSON.stringify(props.slotDays)),
  );
}

function loadPage(): ListingDetailPageModule["default"] {
  const pagePath = path.resolve(
    process.cwd(),
    "src/app/listings/[id]/page.tsx",
  );
  const source = readFileSync(pagePath, "utf8");
  const { outputText } = ts.transpileModule(source, {
    fileName: pagePath,
    compilerOptions: {
      esModuleInterop: true,
      jsx: ts.JsxEmit.ReactJSX,
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  });
  const compiledModule = {
    exports: {} as Record<string, unknown>,
  };
  const localRequire = (specifier: string) => {
    if (specifier === "next/navigation") {
      return { notFound: notFoundMock };
    }
    if (specifier === "@/lib/prisma") {
      return { prisma };
    }
    if (specifier === "@/lib/user") {
      return { getCurrentUser };
    }
    if (specifier === "@/lib/listings/availability") {
      return availability;
    }
    if (specifier === "@/lib/listings/detail") {
      return detail;
    }
    if (specifier === "@/components/listings/listing-detail") {
      return { ListingDetail: ListingDetailMock };
    }
    if (specifier === "@/lib/bookings/queries") {
      return { getBlockingBookingsForListing: async () => [] };
    }
    return nodeRequire(specifier);
  };

  new Function(
    "exports",
    "require",
    "module",
    "__filename",
    "__dirname",
    outputText,
  )(
    compiledModule.exports,
    localRequire,
    compiledModule,
    pagePath,
    path.dirname(pagePath),
  );

  return (compiledModule.exports as ListingDetailPageModule).default;
}

async function renderPage(id = "listing-1"): Promise<string> {
  const Page = loadPage();
  const element = await Page({ params: Promise.resolve({ id }) });
  return renderToStaticMarkup(element);
}

describe("GET /listings/[id]", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-04T08:00:00"));
    vi.mocked(prisma.listing.findUnique).mockReset();
    vi.mocked(getCurrentUser).mockReset();
    notFoundMock.mockReset();
    notFoundMock.mockImplementation(() => {
      throw new Error("NEXT_NOT_FOUND");
    });
  });

  it("queries the listing with a public select that never includes addressFull", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(null);
    vi.mocked(prisma.listing.findUnique).mockResolvedValue(makeListing() as never);

    await renderPage();

    const arg = vi.mocked(prisma.listing.findUnique).mock.calls[0][0];
    expect(arg?.where).toEqual({ id: "listing-1" });

    const select = (arg?.select ?? {}) as Record<string, unknown>;
    expect(Object.keys(select)).not.toContain("addressFull");
    expect(select.addressFull).toBeUndefined();

    const host = select.host as { select?: Record<string, unknown> };
    expect(Object.keys(host.select ?? {})).not.toContain("email");
    expect(Object.keys(host.select ?? {})).not.toContain("supabaseId");
  });

  it("renders an ACTIVE listing without leaking the exact address in HTML", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(null);
    vi.mocked(prisma.listing.findUnique).mockResolvedValue(makeListing() as never);

    const html = await renderPage();

    expect(html).toContain("Bagno del Cortile");
    expect(html).toContain("Trastevere");
    expect(html).toContain("Verificato");
    expect(html).toContain("Conferma istantanea");
    expect(html).not.toContain("addressFull");
    expect(html).not.toContain(SECRET_ADDRESS);
  });

  it.each(["DRAFT", "INACTIVE"] as const)(
    "returns notFound for %s listings",
    async (status) => {
      vi.mocked(getCurrentUser).mockResolvedValue(null);
      vi.mocked(prisma.listing.findUnique).mockResolvedValue(
        makeListing({ status }) as never,
      );

      await expect(renderPage()).rejects.toThrow("NEXT_NOT_FOUND");
      expect(notFoundMock).toHaveBeenCalledTimes(1);
    },
  );

  it("returns notFound when the listing does not exist", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(null);
    vi.mocked(prisma.listing.findUnique).mockResolvedValue(null);

    await expect(renderPage()).rejects.toThrow("NEXT_NOT_FOUND");
    expect(notFoundMock).toHaveBeenCalledTimes(1);
  });

  it("shows a login CTA with redirect for anonymous users", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(null);
    vi.mocked(prisma.listing.findUnique).mockResolvedValue(makeListing() as never);

    const html = await renderPage();

    expect(html).toContain("Accedi per prenotare");
    expect(html).toContain("/auth/signin?redirect=/listings/listing-1");
  });

  it("shows a disabled booking CTA for authenticated users", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(authenticatedUser as never);
    vi.mocked(prisma.listing.findUnique).mockResolvedValue(makeListing() as never);

    const html = await renderPage();

    expect(html).toContain("Prenota ora");
    expect(html).toContain("disabled");
    expect(html).toContain("Disponibile a breve");
    expect(html).not.toContain("Accedi per prenotare");
  });

  it("renders request booking mode when the listing requires host confirmation", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(null);
    vi.mocked(prisma.listing.findUnique).mockResolvedValue(
      makeListing({ bookingMode: "REQUEST" }) as never,
    );

    const html = await renderPage();

    expect(html).toContain("Su richiesta");
  });
});
