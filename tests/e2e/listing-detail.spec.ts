import { test, expect } from "@playwright/test";

/**
 * E2E per US-008 — Pagina di dettaglio listing.
 *
 * Pre-requisiti runtime:
 *  - E2E_LISTING_ID: id di un listing ACTIVE seed (con almeno una availabilityRule)
 *  - E2E_USER_EMAIL / E2E_USER_PASSWORD: credenziali Supabase per il flusso auth
 *
 * Test skippato di default per evitare false negative in CI senza queste env.
 */

const E2E_LISTING_ID = process.env.E2E_LISTING_ID;
const E2E_USER_EMAIL = process.env.E2E_USER_EMAIL;
const E2E_USER_PASSWORD = process.env.E2E_USER_PASSWORD;

test.describe("US-008 listing detail", () => {
  test.skip(
    !E2E_LISTING_ID,
    "Set E2E_LISTING_ID to run the listing detail e2e suite",
  );

  test("non-auth: dalla detail il CTA porta a signin con redirect", async ({
    page,
  }) => {
    await page.goto(`/listings/${E2E_LISTING_ID}`);

    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.getByText("Conferma istantanea").first()).toBeVisible();

    const cta = page.getByRole("link", { name: /Accedi per prenotare/i }).first();
    await expect(cta).toBeVisible();
    await cta.click();

    await expect(page).toHaveURL(
      new RegExp(
        `/auth/signin\\?redirect=/listings/${E2E_LISTING_ID}`,
      ),
    );
  });

  test("auth: detail mostra badge, slot selezionabile, CTA disabilitato", async ({
    page,
  }) => {
    test.skip(
      !E2E_USER_EMAIL || !E2E_USER_PASSWORD,
      "Set E2E_USER_EMAIL and E2E_USER_PASSWORD for the auth flow",
    );

    await page.goto("/auth/signin");
    await page.getByLabel("Email").fill(E2E_USER_EMAIL!);
    await page.getByLabel("Password").fill(E2E_USER_PASSWORD!);
    await page.getByRole("button", { name: "Accedi" }).click();
    await expect(page).toHaveURL(/\/dashboard/);

    await page.goto(`/listings/${E2E_LISTING_ID}`);

    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(
      page.getByText(/Privato|Attivita Commerciale/).first(),
    ).toBeVisible();
    await expect(
      page.getByText(/Conferma istantanea|Su richiesta/).first(),
    ).toBeVisible();

    const slotPill = page.locator("button:has-text(':')").first();
    if (await slotPill.count()) {
      await slotPill.click();
    }

    const bookCta = page.getByRole("button", { name: /Prenota ora/i });
    await expect(bookCta).toBeVisible();
    await expect(bookCta).toBeDisabled();
    await expect(bookCta).toHaveAttribute("title", /Disponibile a breve/i);
  });
});
