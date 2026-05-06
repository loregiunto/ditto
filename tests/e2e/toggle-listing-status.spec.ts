import { test, expect } from "@playwright/test";

/**
 * E2E per US-002 — Pubblicazione e disattivazione listing.
 *
 * Pre-requisiti runtime:
 *  - E2E_USER_EMAIL / E2E_USER_PASSWORD: utente Supabase Auth con almeno
 *    un listing in DB (creato via US-001 o seed).
 *  - L'utente deve avere `stripeAccountId` e `identityStatus='verified'`
 *    settati nel DB perché il gate `canPublish` passi.
 *  - E2E_GATED_USER_EMAIL / E2E_GATED_USER_PASSWORD (opzionale): un utente
 *    con un listing DRAFT e SENZA stripeAccountId/identityStatus, per
 *    coprire lo scenario di blocco gate.
 *
 * Test skippato di default per evitare false negative in CI senza queste env.
 */

const E2E_USER_EMAIL = process.env.E2E_USER_EMAIL;
const E2E_USER_PASSWORD = process.env.E2E_USER_PASSWORD;
const E2E_GATED_USER_EMAIL = process.env.E2E_GATED_USER_EMAIL;
const E2E_GATED_USER_PASSWORD = process.env.E2E_GATED_USER_PASSWORD;

test.describe("US-002 toggle listing status", () => {
  test.skip(
    !E2E_USER_EMAIL || !E2E_USER_PASSWORD,
    "Set E2E_USER_EMAIL and E2E_USER_PASSWORD to run the e2e suite",
  );

  test("host pubblica e poi disattiva un listing dalla dashboard", async ({
    page,
  }) => {
    await page.goto("/auth/signin");
    await page.getByLabel("Email").fill(E2E_USER_EMAIL!);
    await page.getByLabel("Password").fill(E2E_USER_PASSWORD!);
    await page.getByRole("button", { name: "Accedi" }).click();
    await expect(page).toHaveURL(/\/dashboard/);

    await page.goto("/host/dashboard");
    await expect(
      page.getByRole("heading", { name: "I tuoi bagni" }),
    ).toBeVisible();

    const firstToggle = page
      .getByTestId("listing-status-toggle")
      .first();
    const firstBadge = page.getByTestId("listing-status-badge").first();

    const initialLabel = await firstToggle.textContent();

    if (initialLabel?.includes("Pubblica")) {
      await firstToggle.click();
      await expect(firstBadge).toHaveText("Attivo", { timeout: 15_000 });
      await expect(firstToggle).toHaveText("Disattiva", { timeout: 15_000 });

      await firstToggle.click();
      await expect(firstBadge).toHaveText("Disattivato", { timeout: 15_000 });
      await expect(firstToggle).toHaveText("Pubblica", { timeout: 15_000 });
    } else {
      await firstToggle.click();
      await expect(firstBadge).toHaveText("Disattivato", { timeout: 15_000 });
      await expect(firstToggle).toHaveText("Pubblica", { timeout: 15_000 });

      await firstToggle.click();
      await expect(firstBadge).toHaveText("Attivo", { timeout: 15_000 });
      await expect(firstToggle).toHaveText("Disattiva", { timeout: 15_000 });
    }
  });

  test("host non verificato vede un messaggio di blocco e non riesce a pubblicare", async ({
    page,
  }) => {
    test.skip(
      !E2E_GATED_USER_EMAIL || !E2E_GATED_USER_PASSWORD,
      "Set E2E_GATED_USER_EMAIL and E2E_GATED_USER_PASSWORD to run the gate scenario",
    );

    await page.goto("/auth/signin");
    await page.getByLabel("Email").fill(E2E_GATED_USER_EMAIL!);
    await page.getByLabel("Password").fill(E2E_GATED_USER_PASSWORD!);
    await page.getByRole("button", { name: "Accedi" }).click();

    await page.goto("/host/dashboard");
    await expect(
      page.getByText(/Stripe Connect|verifica identità/i),
    ).toBeVisible();

    const firstBadge = page.getByTestId("listing-status-badge").first();
    const initialBadge = await firstBadge.textContent();

    const firstToggle = page
      .getByTestId("listing-status-toggle")
      .first();
    if ((await firstToggle.textContent())?.includes("Pubblica")) {
      await firstToggle.click();
      // Il badge non cambia perché il toggle è bloccato dal gate
      await expect(firstBadge).toHaveText(initialBadge ?? "", {
        timeout: 5_000,
      });
    }
  });
});
