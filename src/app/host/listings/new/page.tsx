import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/user";
import { ListingForm } from "./listing-form";

export default async function NewListingPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/signin");

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 p-6 md:p-10">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">
          Pubblica il tuo bagno
        </h1>
        <p className="text-muted-foreground text-sm">
          Compila tutti i campi per salvare il listing in bozza. Potrai
          pubblicarlo quando avrai completato Stripe Connect e la verifica
          identità.
        </p>
      </div>

      <ListingForm userId={user.supabaseId} />
    </div>
  );
}
