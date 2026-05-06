# Supabase Storage — `listing-photos` bucket

Setup manuale richiesto in **Supabase Dashboard** prima di pubblicare la storia US-001 in produzione.

## 1. Crea il bucket

**Storage → New bucket**

- **Name:** `listing-photos`
- **Public bucket:** ✅ ON (le foto dei listing sono visibili pubblicamente nelle preview)
- **File size limit:** `8 MB`
- **Allowed MIME types:** `image/jpeg, image/png, image/webp`

## 2. RLS policies

Sostituisci eventuali policy di default con queste 4. Su Supabase Dashboard → Storage → `listing-photos` → Policies → New policy.

### Policy: upload nel proprio path

- **Operation:** `INSERT`
- **Target roles:** `authenticated`
- **USING expression:**
  ```sql
  bucket_id = 'listing-photos'
  AND (storage.foldername(name))[1] = auth.uid()::text
  ```

### Policy: update nel proprio path

- **Operation:** `UPDATE`
- **Target roles:** `authenticated`
- **USING expression:**
  ```sql
  bucket_id = 'listing-photos'
  AND (storage.foldername(name))[1] = auth.uid()::text
  ```

### Policy: delete nel proprio path

- **Operation:** `DELETE`
- **Target roles:** `authenticated`
- **USING expression:**
  ```sql
  bucket_id = 'listing-photos'
  AND (storage.foldername(name))[1] = auth.uid()::text
  ```

### Policy: read pubblico

- **Operation:** `SELECT`
- **Target roles:** `anon, authenticated`
- **USING expression:**
  ```sql
  bucket_id = 'listing-photos'
  ```

## 3. Path convention

L'app salva i file nel bucket usando la convenzione:

```
{userId}/drafts/{draftId}/{uuid}.{ext}
```

dove `userId` è il **Supabase Auth UID** (non l'id Prisma). Le policy usano `(storage.foldername(name))[1] = auth.uid()::text` per assicurarsi che ogni utente possa scrivere solo nella propria cartella.

> Nota: la User table di Prisma ha un campo separato `supabaseId` che deve coincidere con `auth.uid()`. Il client Supabase del browser autentica le richieste di upload con il token di sessione, e le policy validano il path lato Storage.
