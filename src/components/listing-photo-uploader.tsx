"use client";

import { useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { MAX_PHOTOS } from "@/lib/validation/listing";

const BUCKET = "listing-photos";
const MIME_TO_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};
const ACCEPTED_MIME = Object.keys(MIME_TO_EXT);
const MAX_SIZE_BYTES = 8 * 1024 * 1024; // 8MB

export type UploadedPhoto = { url: string; path: string };

type Props = {
  userId: string;
  draftId: string;
  photos: UploadedPhoto[];
  onChange: (photos: UploadedPhoto[]) => void;
  onUploadingChange?: (uploading: boolean) => void;
};

export function ListingPhotoUploader({
  userId,
  draftId,
  photos,
  onChange,
  onUploadingChange,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const setUploadingState = (next: boolean) => {
    setUploading(next);
    onUploadingChange?.(next);
  };

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setError(null);

    const remaining = MAX_PHOTOS - photos.length;
    const toUpload = Array.from(files).slice(0, remaining);
    if (files.length > remaining) {
      setError(`Massimo ${MAX_PHOTOS} foto totali.`);
    }

    setUploadingState(true);
    const supabase = createClient();
    const uploaded: UploadedPhoto[] = [];

    for (const file of toUpload) {
      const ext = MIME_TO_EXT[file.type];
      if (!ext) {
        setError(`Formato non supportato: ${file.name}`);
        continue;
      }
      if (file.size > MAX_SIZE_BYTES) {
        setError(`File troppo grande: ${file.name}`);
        continue;
      }
      const path = `${userId}/drafts/${draftId}/${crypto.randomUUID()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from(BUCKET)
        .upload(path, file, { contentType: file.type, upsert: false });
      if (upErr) {
        setError(`Upload fallito: ${upErr.message}`);
        continue;
      }
      const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
      uploaded.push({ url: data.publicUrl, path });
    }

    onChange([...photos, ...uploaded]);
    setUploadingState(false);
    if (inputRef.current) inputRef.current.value = "";
  };

  const removePhoto = async (photo: UploadedPhoto) => {
    const supabase = createClient();
    await supabase.storage.from(BUCKET).remove([photo.path]);
    onChange(photos.filter((p) => p.path !== photo.path));
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
        {photos.map((p) => (
          <div
            key={p.path}
            className="group relative aspect-square overflow-hidden rounded-md border"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={p.url}
              alt="foto listing"
              className="h-full w-full object-cover"
            />
            <button
              type="button"
              onClick={() => removePhoto(p)}
              className="bg-destructive text-destructive-foreground absolute top-1 right-1 rounded px-2 py-0.5 text-xs opacity-0 transition group-hover:opacity-100"
            >
              Rimuovi
            </button>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => inputRef.current?.click()}
          disabled={uploading || photos.length >= MAX_PHOTOS}
        >
          {uploading ? "Caricamento..." : "Aggiungi foto"}
        </Button>
        <p className="text-muted-foreground text-sm">
          {photos.length}/{MAX_PHOTOS} foto
        </p>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_MIME.join(",")}
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />

      {error && <p className="text-destructive text-sm">{error}</p>}
    </div>
  );
}
