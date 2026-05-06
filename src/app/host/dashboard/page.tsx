import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/user";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import {
  canPublish,
  CAN_PUBLISH_REASON_MESSAGES,
} from "@/lib/listings/can-publish";
import { ListingStatusToggle } from "./listing-status-toggle";

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<"DRAFT" | "ACTIVE" | "INACTIVE", string> = {
  DRAFT: "Bozza",
  ACTIVE: "Attivo",
  INACTIVE: "Disattivato",
};

const STATUS_BADGE_CLASS: Record<"DRAFT" | "ACTIVE" | "INACTIVE", string> = {
  DRAFT: "bg-muted text-muted-foreground",
  ACTIVE: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  INACTIVE: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
};

export default async function HostDashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/signin");

  const [listings, gate] = await Promise.all([
    prisma.listing.findMany({
      where: { hostId: user.id },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        title: true,
        addressDisplay: true,
        hourlyPriceCents: true,
        status: true,
        photos: {
          orderBy: { order: "asc" },
          take: 1,
          select: { url: true },
        },
      },
    }),
    Promise.resolve(canPublish(user)),
  ]);

  const hasPublishableListing = listings.some((l) => l.status !== "ACTIVE");
  const blockReason =
    !gate.ok && hasPublishableListing
      ? CAN_PUBLISH_REASON_MESSAGES[gate.reason]
      : null;

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 p-6 md:p-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-semibold tracking-tight">
            I tuoi bagni
          </h1>
          <p className="text-muted-foreground text-sm">
            Pubblica un listing per renderlo visibile sulla mappa, o
            disattivalo per nasconderlo temporaneamente.
          </p>
        </div>
        <Link href="/host/listings/new">
          <Button>Nuovo bagno</Button>
        </Link>
      </div>

      {blockReason && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-800/50 dark:bg-amber-950/40 dark:text-amber-200">
          {blockReason}
        </div>
      )}

      {listings.length === 0 ? (
        <div className="rounded-xl border border-dashed p-10 text-center">
          <p className="text-muted-foreground text-sm">
            Non hai ancora creato nessun listing.
          </p>
          <Link href="/host/listings/new" className="mt-3 inline-block">
            <Button variant="outline" size="sm">
              Crea il tuo primo bagno
            </Button>
          </Link>
        </div>
      ) : (
        <ul className="flex flex-col gap-4">
          {listings.map((l) => (
            <li
              key={l.id}
              className="bg-card text-card-foreground grid grid-cols-1 gap-0 overflow-hidden rounded-xl ring-1 ring-foreground/10 sm:grid-cols-[200px_1fr_auto]"
            >
              <div className="bg-muted aspect-[4/3] sm:aspect-auto sm:h-full">
                {l.photos[0] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={l.photos[0].url}
                    alt={l.title}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="text-muted-foreground flex h-full w-full items-center justify-center text-xs">
                    Nessuna foto
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-2 p-5">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-lg font-medium">{l.title}</h2>
                  <span
                    data-testid="listing-status-badge"
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_BADGE_CLASS[l.status]}`}
                  >
                    {STATUS_LABEL[l.status]}
                  </span>
                </div>
                <p className="text-muted-foreground text-sm">
                  {l.addressDisplay}
                </p>
                <p className="text-sm font-medium">
                  €{(l.hourlyPriceCents / 100).toFixed(2)}/h
                </p>
              </div>

              <div className="flex flex-col items-stretch justify-center gap-2 border-t p-4 sm:items-end sm:border-t-0 sm:border-l">
                <ListingStatusToggle
                  listingId={l.id}
                  status={l.status}
                  canPublish={gate.ok}
                  blockReason={blockReason}
                />
                <Link href={`/host/listings/${l.id}/availability`}>
                  <Button
                    variant="outline"
                    size="sm"
                    data-testid="manage-availability-link"
                    className="w-full sm:w-auto"
                  >
                    Gestisci disponibilità
                  </Button>
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
