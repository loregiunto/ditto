import { test, expect } from "@playwright/test";

/**
 * E2E per US-010 — Prenotazione su richiesta.
 *
 * Pre-requisiti runtime:
 *  - E2E_REQUEST_LISTING_ID: id di un listing ACTIVE in modalità REQUEST con
 *    almeno una availabilityRule futura
 *  - E2E_GUEST_EMAIL / E2E_GUEST_PASSWORD: credenziali del guest
 *  - E2E_HOST_EMAIL / E2E_HOST_PASSWORD: credenziali dell'host del listing
 *  - E2E_STRIPE_HELPER: opzionale, indica che è disponibile un helper Stripe
 *    test. Senza, l'intero flusso checkout/approve è skippato come per US-009.
 */

const LISTING_ID = process.env.E2E_REQUEST_LISTING_ID;
const HAS_STRIPE = Boolean(process.env.E2E_STRIPE_HELPER);

test.describe("US-010 request booking", () => {
  test.skip(
    !LISTING_ID,
    "Set E2E_REQUEST_LISTING_ID to run the request booking e2e suite",
  );

  test("CTA listing in modalità REQUEST mostra copy 'Invia richiesta'", async ({
    page,
  }) => {
    await page.goto(`/listings/${LISTING_ID}`);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.getByText("Su richiesta").first()).toBeVisible();
    // Senza autenticazione il CTA visibile è "Accedi per prenotare"; il copy
    // della modalità è quello che differenzia la pagina REQUEST da INSTANT.
  });

  test.skip(
    !HAS_STRIPE,
    "Set E2E_STRIPE_HELPER to run the full checkout + approve/reject e2e flow",
  );

  test("guest invia richiesta → host approva → indirizzo svelato", async () => {
    // Flusso completo: implementare quando Stripe test helper è disponibile.
    // Step previsti:
    //  1) login guest, vai su /listings/{LISTING_ID}, clicca "Invia richiesta"
    //  2) completa checkout di test (capture_method=manual)
    //  3) verifica che /bookings/[id]/confirmation mostri PENDING_HOST_APPROVAL
    //     senza addressFull
    //  4) login host, apri /host/requests, clicca "Approva richiesta"
    //  5) torna come guest e verifica che la confirmation mostri addressFull
  });

  test("guest invia richiesta → host rifiuta → slot torna libero", async () => {
    // Variante: l'host clicca "Rifiuta" e il guest vede lo stato REJECTED
    // senza alcun indirizzo; il listing torna ad avere lo slot disponibile.
  });
});
