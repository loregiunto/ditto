import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/user";
import { DsTopnav, DsDisplayTitle, DsLinkButton } from "@/components/design-system";
import { ListingForm } from "./listing-form";

export default async function NewListingPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/signin");

  return (
    <div className="ds-surface">
      <DsTopnav
        rightSlot={
          <DsLinkButton href="/host/dashboard" variant="ghost" size="sm">
            Dashboard
          </DsLinkButton>
        }
      />

      <main className="ds-page-narrow">
        <nav className="ds-crumbs" aria-label="Breadcrumb">
          <Link href="/host/dashboard">Dashboard</Link>
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            aria-hidden="true"
          >
            <path d="m9 18 6-6-6-6" />
          </svg>
          <span className="current">Nuovo bagno</span>
        </nav>

        <section className="ds-title-block">
          <DsDisplayTitle
            eyebrow="Crea annuncio"
            text="Pubblica il tuo bagno"
            subtitle="Compila tutti i campi per salvare il listing in bozza. Potrai pubblicarlo dopo Stripe Connect e la verifica identità."
          />
        </section>

        <ListingForm userId={user.supabaseId} />
      </main>
    </div>
  );
}
