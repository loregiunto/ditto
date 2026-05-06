import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  AVAILABILITY_WINDOW_HOURS,
  toPublicMapDTO,
} from "@/lib/listings/discovery";
import { weeklyRulesToSlots } from "@/lib/listings/availability";

export const dynamic = "force-dynamic";

export async function GET() {
  // Public endpoint — no auth required. The Prisma `select` is the structural
  // privacy guarantee: `addressFull` is never read from the DB nor serialized.
  const listings = await prisma.listing.findMany({
    where: { status: "ACTIVE" },
    select: {
      id: true,
      title: true,
      addressDisplay: true,
      latitude: true,
      longitude: true,
      hourlyPriceCents: true,
      hostType: true,
      photos: {
        select: { url: true, order: true },
      },
      availabilityRules: {
        select: { dayOfWeek: true, startMinute: true, endMinute: true },
      },
    },
  });

  const now = new Date();
  const windowEnd = new Date(
    now.getTime() + AVAILABILITY_WINDOW_HOURS * 60 * 60 * 1000,
  );

  const available = listings.filter((l) => {
    const slots = weeklyRulesToSlots(l.availabilityRules, now, windowEnd);
    return slots.length > 0;
  });

  return NextResponse.json(
    { listings: available.map(toPublicMapDTO) },
    { status: 200 },
  );
}
