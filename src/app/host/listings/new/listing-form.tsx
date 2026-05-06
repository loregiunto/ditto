"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  ListingPhotoUploader,
  type UploadedPhoto,
} from "@/components/listing-photo-uploader";
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
      setError(first ? `${first.path.join(".")}: ${first.message}` : "Dati non validi.");
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
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Tipo di host</CardTitle>
          <CardDescription>
            Indica se ospiti come privato o come attività commerciale.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <fieldset className="flex flex-col gap-3" aria-label="Tipo di host">
            <label className="hover:bg-accent flex cursor-pointer items-start gap-3 rounded-md border p-3">
              <input
                type="radio"
                name="hostType"
                value="PRIVATE"
                checked={state.hostType === "PRIVATE"}
                onChange={() => update("hostType", "PRIVATE")}
                className="mt-1"
              />
              <div className="flex flex-col">
                <span className="font-medium">🏠 Privato</span>
                <span className="text-muted-foreground text-sm">
                  Apri un tuo bagno di casa.
                </span>
              </div>
            </label>
            <label className="hover:bg-accent flex cursor-pointer items-start gap-3 rounded-md border p-3">
              <input
                type="radio"
                name="hostType"
                value="BUSINESS"
                checked={state.hostType === "BUSINESS"}
                onChange={() => update("hostType", "BUSINESS")}
                className="mt-1"
              />
              <div className="flex flex-col">
                <span className="font-medium">🏪 Attività Commerciale</span>
                <span className="text-muted-foreground text-sm">
                  Bar, B&B, studio o altra attività con P.IVA.
                </span>
              </div>
            </label>
          </fieldset>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Il bagno</CardTitle>
          <CardDescription>
            Titolo, descrizione e indirizzo del tuo spazio.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="title">Titolo</Label>
            <Input
              id="title"
              value={state.title}
              onChange={(e) => update("title", e.target.value)}
              placeholder="Bagno luminoso in centro storico"
              minLength={TITLE_MIN}
              required
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="description">Descrizione</Label>
            <Textarea
              id="description"
              rows={5}
              value={state.description}
              onChange={(e) => update("description", e.target.value)}
              placeholder="Pulito, riscaldato, con asciugamani e prodotti igienici."
              minLength={DESC_MIN}
              required
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="address">Indirizzo</Label>
            <Input
              id="address"
              value={state.address}
              onChange={(e) => update("address", e.target.value)}
              placeholder="Via Roma 1, Firenze"
              required
            />
            <p className="text-muted-foreground text-xs">
              L'indirizzo esatto non sarà mai visibile prima della prenotazione.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Prezzo</CardTitle>
          <CardDescription>
            Tariffa oraria in euro (min €{(PRICE_MIN_CENTS / 100).toFixed(2)},
            max €{(PRICE_MAX_CENTS / 100).toFixed(2)}).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-2">
            <Label htmlFor="price">Prezzo orario (€)</Label>
            <Input
              id="price"
              type="number"
              step="0.50"
              min={PRICE_MIN_CENTS / 100}
              max={PRICE_MAX_CENTS / 100}
              value={state.hourlyPriceEuros}
              onChange={(e) => update("hourlyPriceEuros", e.target.value)}
              required
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Foto</CardTitle>
          <CardDescription>
            Carica almeno 1 foto, fino a 10. Formati: JPEG, PNG, WebP.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ListingPhotoUploader
            userId={userId}
            draftId={draftId}
            photos={photos}
            onChange={setPhotos}
            onUploadingChange={setPhotosUploading}
          />
        </CardContent>
      </Card>

      {error && (
        <p className="text-destructive text-sm" role="alert">
          {error}
        </p>
      )}

      <div className="flex justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/dashboard")}
        >
          Annulla
        </Button>
        <Button type="submit" disabled={submitting || photosUploading}>
          {submitting
            ? "Salvataggio..."
            : photosUploading
              ? "Attendi caricamento foto..."
              : "Salva bozza"}
        </Button>
      </div>
    </form>
  );
}
