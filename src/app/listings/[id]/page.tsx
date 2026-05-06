import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/user";
import { weeklyRulesToSlots } from "@/lib/listings/availability";
import {
  DETAIL_HORIZON_DAYS,
  DETAIL_SLOT_MINUTES,
  toPublicDetailDTO,
  toPublicSlotDays,
} from "@/lib/listings/detail";
import { ListingDetail } from "@/components/listings/listing-detail";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function ListingDetailPage({ params }: PageProps) {
  const { id } = await params;

  const listing = await prisma.listing.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      description: true,
      addressDisplay: true,
      latitude: true,
      longitude: true,
      hourlyPriceCents: true,
      hostType: true,
      bookingMode: true,
      status: true,
      photos: {
        select: {
          id: true,
          url: true,
          order: true,
        },
      },
      availabilityRules: {
        select: {
          dayOfWeek: true,
          startMinute: true,
          endMinute: true,
        },
      },
      host: {
        select: {
          name: true,
          image: true,
          identityStatus: true,
        },
      },
    },
  });

  if (!listing || listing.status !== "ACTIVE") {
    notFound();
  }

  const now = new Date();
  const horizonEnd = new Date(
    now.getTime() + DETAIL_HORIZON_DAYS * 24 * 60 * 60 * 1000,
  );
  const projectedSlots = weeklyRulesToSlots(
    listing.availabilityRules,
    now,
    horizonEnd,
    DETAIL_SLOT_MINUTES,
    [],
  );
  const currentUser = await getCurrentUser();

  return (
    <ListingDetail
      listing={toPublicDetailDTO(listing)}
      slotDays={toPublicSlotDays(projectedSlots, now)}
      isAuthenticated={Boolean(currentUser)}
      signInHref={`/auth/signin?redirect=/listings/${encodeURIComponent(id)}`}
    />
  );
}
