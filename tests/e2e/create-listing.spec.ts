import { test, expect } from "@playwright/test";

/**
 * E2E happy-path per US-001 — Creazione listing bagno.
 *
 * Pre-requisiti runtime:
 *  - Variabili E2E_USER_EMAIL / E2E_USER_PASSWORD configurate per un utente
 *    già esistente in Supabase Auth (via signup manuale o seed)
 *  - MAPBOX_ACCESS_TOKEN configurato lato server (per il geocoding)
 *  - Bucket "listing-photos" già creato in Supabase Storage
 *
 * Test skippato di default per evitare false negative in CI senza queste env.
 */

const E2E_USER_EMAIL = process.env.E2E_USER_EMAIL;
const E2E_USER_PASSWORD = process.env.E2E_USER_PASSWORD;

test.skip(
  !E2E_USER_EMAIL || !E2E_USER_PASSWORD,
  "Set E2E_USER_EMAIL and E2E_USER_PASSWORD to run the e2e suite",
);

test("host crea listing in bozza con foto e indirizzo geocodificato", async ({
  page,
}) => {
  await page.goto("/auth/signin");
  await page.getByLabel("Email").fill(E2E_USER_EMAIL!);
  await page.getByLabel("Password").fill(E2E_USER_PASSWORD!);
  await page.getByRole("button", { name: "Accedi" }).click();
  await expect(page).toHaveURL(/\/dashboard/);

  await page.goto("/host/listings/new");
  await expect(
    page.getByRole("heading", { name: "Pubblica il tuo bagno" }),
  ).toBeVisible();

  await page.getByLabel("Titolo").fill("Bagno luminoso in centro storico");
  await page
    .getByLabel("Descrizione")
    .fill(
      "Spazio pulito e privato, riscaldato e con tutto il necessario per gli ospiti.",
    );
  await page.getByLabel("Indirizzo").fill("Via Roma 1, Firenze");
  await page.getByLabel("Prezzo orario (€)").fill("4");

  const fixturePath = "./tests/e2e/fixtures/sample.jpg";
  await page.locator('input[type="file"]').setInputFiles([fixturePath]);
  await expect(page.getByText("1/10 foto")).toBeVisible({ timeout: 15_000 });

  await page.getByRole("button", { name: "Salva bozza" }).click();

  await expect(page).toHaveURL(/\/dashboard/, { timeout: 20_000 });
});
