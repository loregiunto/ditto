import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/user";
import { prisma } from "@/lib/prisma";
import { AvailabilityEditor } from "./availability-editor";

export const dynamic = "force-dynamic";

export default async function ListingAvailabilityPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/signin");

  const { id } = await params;

  const listing = await prisma.listing.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      addressDisplay: true,
      hourlyPriceCents: true,
      hostId: true,
    },
  });

  if (!listing || listing.hostId !== user.id) {
    redirect("/host/dashboard");
  }

  const rules = await prisma.availabilityRule.findMany({
    where: { listingId: id },
    orderBy: [{ dayOfWeek: "asc" }, { startMinute: "asc" }],
    select: { dayOfWeek: true, startMinute: true, endMinute: true },
  });

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-6 md:p-10">
      <div className="flex flex-col gap-3">
        <nav className="text-muted-foreground text-sm">
          <Link href="/host/dashboard" className="hover:underline">
            Dashboard
          </Link>
          <span className="mx-2 opacity-50">/</span>
          <span>{listing.title}</span>
          <span className="mx-2 opacity-50">/</span>
          <span className="text-foreground font-medium">Disponibilità</span>
        </nav>
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-semibold tracking-tight">
            Quando ti trovano aperta?
          </h1>
          <p className="text-muted-foreground text-sm">
            {listing.addressDisplay} · €
            {(listing.hourlyPriceCents / 100).toFixed(2)}/h
          </p>
          <p className="text-muted-foreground text-sm">
            Trascina sulla griglia per attivare le fasce orarie in cui il tuo
            bagno è prenotabile. Le impostazioni si ripetono ogni settimana.
          </p>
        </div>
      </div>

      <AvailabilityEditor listingId={listing.id} initialRules={rules} />
    </div>
  );
}
