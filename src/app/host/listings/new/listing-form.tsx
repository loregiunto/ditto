"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Label } from "@/components/ui/label";
import {
  ListingPhotoUploader,
  type UploadedPhoto,
} from "@/components/listing-photo-uploader";
import { DsBadge } from "@/components/design-system";
import { cn } from "@/lib/utils";
import {
  listingInputSchema,
  TITLE_MIN,
  DESC_MIN,
  PRICE_MIN_CENTS,
  PRICE_MAX_CENTS,
} from "@/lib/validation/listing";

type FormState = {
  title: string;
  description: string;
  hostType: "PRIVATE" | "BUSINESS";
  address: string;
  hourlyPriceEuros: string;
};

const initial: FormState = {
  title: "",
  description: "",
  hostType: "PRIVATE",
  address: "",
  hourlyPriceEuros: "4",
};

export function ListingForm({ userId }: { userId: string }) {
  const router = useRouter();
  const draftId = useMemo(() => crypto.randomUUID(), []);
  const [state, setState] = useState<FormState>(initial);
  const [photos, setPhotos] = useState<UploadedPhoto[]>([]);
  const [photosUploading, setPhotosUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setState((s) => ({ ...s, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const priceFloat = Number(state.hourlyPriceEuros);
    if (!Number.isFinite(priceFloat) || priceFloat <= 0) {
      setError("Prezzo non valido.");
      return;
    }
    const hourlyPriceCents = Math.round(priceFloat * 100);

    const payload = {
      title: state.title,
      description: state.description,
      hostType: state.hostType,
      address: state.address,
      hourlyPriceCents,
      photos: photos.map((p, i) => ({ path: p.path, order: i })),
    };

    const parsed = listingInputSchema.safeParse(payload);
    if (!parsed.success) {
      const first = parsed.error.issues[0];
      setError(
        first ? `${first.path.join(".")}: ${first.message}` : "Dati non validi.",
      );
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/listings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? `Errore ${res.status}`);
        return;
      }
      router.push("/dashboard");
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* TIPO HOST */}
      <section className="ds-card">
        <div className="ds-card-head">
          <h3 className="ds-section-title">
            Sei un <em>privato</em> o un&apos;<em>attività</em>?
          </h3>
          <span className="ds-card-step">Passo 1 / 4</span>
        </div>
        <p className="ds-card-sub">
          Indica se ospiti come privato o come attività commerciale.
        </p>

        <fieldset className="ds-radio-cards" aria-label="Tipo di host">
          <legend className="sr-only">Tipo di host</legend>
          <label
            className={cn(
              "ds-radio-card",
              state.hostType === "PRIVATE" && "selected",
            )}
          >
            <input
              type="radio"
              name="hostType"
              value="PRIVATE"
              checked={state.hostType === "PRIVATE"}
              onChange={() => update("hostType", "PRIVATE")}
            />
            <span className="ds-radio-dot" aria-hidden="true" />
            <div className="ds-radio-body">
              <div className="ds-radio-top">
                <h4>Privato</h4>
                <DsBadge variant="private">Privato</DsBadge>
              </div>
              <p>
                Affitto occasionale del tuo bagno di casa. Nessuna partita IVA
                richiesta.
              </p>
            </div>
          </label>

          <label
            className={cn(
              "ds-radio-card",
              state.hostType === "BUSINESS" && "selected",
            )}
          >
            <input
              type="radio"
              name="hostType"
              value="BUSINESS"
              checked={state.hostType === "BUSINESS"}
              onChange={() => update("hostType", "BUSINESS")}
            />
            <span className="ds-radio-dot" aria-hidden="true" />
            <div className="ds-radio-body">
              <div className="ds-radio-top">
                <h4>Attività</h4>
                <DsBadge variant="business">Attività</DsBadge>
              </div>
              <p>
                Bar, B&amp;B, studio o altra attività con P.IVA. Ricevute
                automatiche.
              </p>
            </div>
          </label>
        </fieldset>
      </section>

      {/* IL BAGNO */}
      <section className="ds-card">
        <div className="ds-card-head">
          <h3 className="ds-section-title">
            Il <em>bagno</em>
          </h3>
          <span className="ds-card-step">Passo 2 / 4</span>
        </div>
        <p className="ds-card-sub">
          Titolo, descrizione e indirizzo del tuo spazio.
        </p>

        <div className="ds-field">
          <Label htmlFor="title" className="ds-field-label">
            Titolo<span className="req">*</span>
          </Label>
          <input
            id="title"
            className="ds-input"
            value={state.title}
            onChange={(e) => update("title", e.target.value)}
            placeholder="Bagno luminoso in centro storico"
            minLength={TITLE_MIN}
            required
          />
        </div>

        <div className="ds-field">
          <Label htmlFor="description" className="ds-field-label">
            Descrizione<span className="req">*</span>
          </Label>
          <textarea
            id="description"
            className="ds-textarea"
            rows={5}
            value={state.description}
            onChange={(e) => update("description", e.target.value)}
            placeholder="Pulito, riscaldato, con asciugamani e prodotti igienici."
            minLength={DESC_MIN}
            required
          />
        </div>

        <div className="ds-field">
          <Label htmlFor="address" className="ds-field-label">
            Indirizzo<span className="req">*</span>
          </Label>
          <input
            id="address"
            className="ds-input"
            value={state.address}
            onChange={(e) => update("address", e.target.value)}
            placeholder="Via Roma 1, Firenze"
            required
          />
          <p className="ds-field-hint">
            L&apos;indirizzo esatto non sarà mai visibile prima della
            prenotazione.
          </p>
        </div>
      </section>

      {/* PREZZO */}
      <section className="ds-card">
        <div className="ds-card-head">
          <h3 className="ds-section-title">
            Quanto <em>chiedi</em>
          </h3>
          <span className="ds-card-step">Passo 3 / 4</span>
        </div>
        <p className="ds-card-sub">
          Tariffa oraria in euro (min €{(PRICE_MIN_CENTS / 100).toFixed(2)},
          max €{(PRICE_MAX_CENTS / 100).toFixed(2)}).
        </p>

        <div className="ds-field">
          <Label htmlFor="price" className="ds-field-label">
            Prezzo orario (€)<span className="req">*</span>
          </Label>
          <input
            id="price"
            className="ds-input"
            type="number"
            step="0.50"
            min={PRICE_MIN_CENTS / 100}
            max={PRICE_MAX_CENTS / 100}
            value={state.hourlyPriceEuros}
            onChange={(e) => update("hourlyPriceEuros", e.target.value)}
            required
          />
        </div>
      </section>

      {/* FOTO */}
      <section className="ds-card">
        <div className="ds-card-head">
          <h3 className="ds-section-title">
            Le <em>foto</em>
          </h3>
          <span className="ds-card-step">Passo 4 / 4</span>
        </div>
        <p className="ds-card-sub">
          Carica almeno 1 foto, fino a 10. Formati: JPEG, PNG, WebP.
        </p>

        <ListingPhotoUploader
          userId={userId}
          draftId={draftId}
          photos={photos}
          onChange={setPhotos}
          onUploadingChange={setPhotosUploading}
        />
      </section>

      {error && (
        <p className="ds-form-error" role="alert">
          {error}
        </p>
      )}

      <div className="ds-form-footer">
        <button
          type="button"
          className="ds-btn ds-btn-ghost"
          onClick={() => router.push("/host/dashboard")}
        >
          Annulla
        </button>
        <button
          type="submit"
          className={cn(
            "ds-btn ds-btn-accent",
            (submitting || photosUploading) && "disabled",
          )}
          disabled={submitting || photosUploading}
        >
          {submitting
            ? "Salvataggio..."
            : photosUploading
              ? "Attendi caricamento foto..."
              : "Salva bozza"}
        </button>
      </div>
    </form>
  );
}
