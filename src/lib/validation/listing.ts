import { z } from "zod";

export const HOST_TYPES = ["PRIVATE", "BUSINESS"] as const;
export const MAX_PHOTOS = 10;
export const MIN_PHOTOS = 1;
export const TITLE_MIN = 4;
export const TITLE_MAX = 80;
export const DESC_MIN = 20;
export const DESC_MAX = 1000;
export const PRICE_MIN_CENTS = 100; // €1.00
export const PRICE_MAX_CENTS = 5000; // €50.00

export const photoSchema = z.object({
  path: z
    .string()
    .min(1)
    .max(512)
    .regex(/^[\w./-]+$/, "Path foto non valido")
    .refine((p) => !p.includes(".."), "Path traversal non consentito"),
  order: z.number().int().min(0).max(MAX_PHOTOS - 1),
});

export const listingInputSchema = z.object({
  title: z.string().trim().min(TITLE_MIN).max(TITLE_MAX),
  description: z.string().trim().min(DESC_MIN).max(DESC_MAX),
  hostType: z.enum(HOST_TYPES),
  address: z.string().trim().min(5).max(200),
  hourlyPriceCents: z
    .number()
    .int()
    .min(PRICE_MIN_CENTS)
    .max(PRICE_MAX_CENTS),
  photos: z.array(photoSchema).min(MIN_PHOTOS).max(MAX_PHOTOS),
});

export type ListingInput = z.infer<typeof listingInputSchema>;
