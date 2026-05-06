"use client";

import { useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { MAX_PHOTOS } from "@/lib/validation/listing";
import { cn } from "@/lib/utils";

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
    <div>
      {photos.length > 0 && (
        <div className="ds-photo-grid">
          {photos.map((p) => (
            <div key={p.path} className="ds-photo-tile">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.url} alt="foto listing" />
              <button
                type="button"
                className="remove"
                onClick={() => removePhoto(p)}
                aria-label="Rimuovi foto"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2.5}
                  aria-hidden="true"
                >
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="ds-uploader">
        <button
          type="button"
          className={cn(
            "ds-btn",
            (uploading || photos.length >= MAX_PHOTOS) && "disabled",
          )}
          onClick={() => inputRef.current?.click()}
          disabled={uploading || photos.length >= MAX_PHOTOS}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            aria-hidden="true"
          >
            <path d="M12 5v14M5 12h14" />
          </svg>
          {uploading ? "Caricamento..." : "Aggiungi foto"}
        </button>
        <p
          style={{
            marginTop: "10px",
            fontSize: "13px",
            color: "var(--ds-ink-3)",
          }}
        >
          {photos.length}/{MAX_PHOTOS} foto
        </p>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_MIME.join(",")}
        multiple
        className="hidden"
        style={{ display: "none" }}
        onChange={(e) => handleFiles(e.target.files)}
      />

      {error && (
        <p
          style={{
            marginTop: "10px",
            fontSize: "13px",
            color: "oklch(0.42 0.13 25)",
          }}
        >
          {error}
        </p>
      )}
    </div>
  );
}
