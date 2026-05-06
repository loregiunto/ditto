import { test, expect } from "@playwright/test";

/**
 * E2E per US-027 — Stato vuoto della dashboard host.
 *
 * Pre-requisiti runtime:
 *  - E2E_EMPTY_USER_EMAIL / E2E_EMPTY_USER_PASSWORD: utente Supabase Auth
 *    SENZA listing in DB. Usato per verificare il nuovo empty state DS.
 *
 * Skippato di default per evitare false negative in CI senza queste env.
 */

const EMPTY_EMAIL = process.env.E2E_EMPTY_USER_EMAIL;
const EMPTY_PASSWORD = process.env.E2E_EMPTY_USER_PASSWORD;

test.describe("US-027 host dashboard empty state", () => {
  test.skip(
    !EMPTY_EMAIL || !EMPTY_PASSWORD,
    "Set E2E_EMPTY_USER_EMAIL and E2E_EMPTY_USER_PASSWORD to run",
  );

  test("host senza listing vede l'empty state DS e la CTA porta a /host/listings/new", async ({
    page,
  }) => {
    await page.goto("/auth/signin");
    await page.getByLabel("Email").fill(EMPTY_EMAIL!);
    await page.getByLabel("Password").fill(EMPTY_PASSWORD!);
    await page.getByRole("button", { name: "Accedi" }).click();
    await expect(page).toHaveURL(/\/dashboard/);

    await page.goto("/host/dashboard");
    await expect(
      page.getByRole("heading", { name: "I tuoi bagni" }),
    ).toBeVisible();

    // Empty state heading (DsEmptyState con <em> terracotta)
    await expect(
      page.getByRole("heading", { name: /Il primo .* è una storia/i }),
    ).toBeVisible();

    const cta = page.getByRole("link", {
      name: /Crea il tuo primo bagno/i,
    });
    await expect(cta).toBeVisible();
    await cta.click();

    await expect(page).toHaveURL(/\/host\/listings\/new/);
    await expect(
      page.getByRole("heading", { name: "Pubblica il tuo bagno" }),
    ).toBeVisible();
  });
});
