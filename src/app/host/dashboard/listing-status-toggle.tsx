"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

type Status = "DRAFT" | "ACTIVE" | "INACTIVE";

type Props = {
  listingId: string;
  status: Status;
  canPublish: boolean;
  blockReason: string | null;
};

export function ListingStatusToggle({
  listingId,
  status,
  canPublish,
  blockReason,
}: Props) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [, startTransition] = useTransition();

  const isActive = status === "ACTIVE";
  const targetStatus: "active" | "inactive" = isActive ? "inactive" : "active";
  const label = isActive ? "Disattiva" : "Pubblica";

  const disablePublish = !isActive && !canPublish;

  async function onClick() {
    setPending(true);
    try {
      const res = await fetch(`/api/listings/${listingId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: targetStatus }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}) as { error?: string });
        toast.error(data.error ?? "Impossibile aggiornare lo status");
        return;
      }

      toast.success(
        isActive ? "Listing disattivato" : "Listing pubblicato",
      );
      startTransition(() => router.refresh());
    } catch {
      toast.error("Errore di rete, riprova");
    } finally {
      setPending(false);
    }
  }

  return (
    <Button
      type="button"
      variant={isActive ? "outline" : "default"}
      size="sm"
      disabled={pending || disablePublish}
      title={disablePublish && blockReason ? blockReason : undefined}
      onClick={onClick}
      data-testid="listing-status-toggle"
    >
      {pending ? "Aggiornamento…" : label}
    </Button>
  );
}
