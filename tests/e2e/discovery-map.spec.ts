import { test, expect } from "@playwright/test";

/**
 * E2E per US-005 — Mappa interattiva.
 *
 * Skippato di default: richiede NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN per il rendering
 * del tile style. La logica testata (DOM dei marker + popup) è indipendente da
 * WebGL: i marker sono elementi HTML reali ancorati alla mappa.
 */

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;

test.describe("US-005 discovery map", () => {
  test.skip(
    !MAPBOX_TOKEN,
    "Set NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN to run the discovery map e2e suite",
  );

  test("happy path: pin click apre la preview card", async ({ page, context }) => {
    // Allow geolocation so we don't trigger the denied banner; mock to Roma.
    await context.grantPermissions(["geolocation"]);
    await context.setGeolocation({ latitude: 41.9028, longitude: 12.4964 });

    await page.route("**/api/listings/map", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          listings: [
            {
              id: "lst-1",
              title: "Bagno del Cortile",
              addressDisplay: "Trastevere",
              latitude: 41.89,
              longitude: 12.47,
              hourlyPriceCents: 350,
              hostType: "PRIVATE",
              photoUrl: null,
            },
            {
              id: "lst-2",
              title: "Caffè Centrale",
              addressDisplay: "Centro Storico",
              latitude: 41.901,
              longitude: 12.481,
              hourlyPriceCents: 200,
              hostType: "BUSINESS",
              photoUrl: null,
            },
          ],
        }),
      }),
    );

    await page.goto("/");
    await expect(page.getByTestId("map-view")).toBeVisible();

    const pins = page.locator('[data-testid="map-pin"]');
    await expect(pins.first()).toBeVisible({ timeout: 15_000 });

    await pins.first().click();
    const card = page.getByTestId("listing-preview-card");
    await expect(card).toBeVisible();
    await expect(card.getByTestId("listing-preview-title")).toContainText(
      /Bagno del Cortile|Caffè Centrale/,
    );
    await expect(card.getByTestId("listing-preview-price")).toContainText("/h");
  });

  test("geolocalizzazione negata mostra il banner di fallback", async ({
    page,
    context,
  }) => {
    // Deny geolocation explicitly.
    await context.clearPermissions();

    await page.route("**/api/listings/map", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ listings: [] }),
      }),
    );

    // Force navigator.geolocation.getCurrentPosition to error out.
    await page.addInitScript(() => {
      Object.defineProperty(navigator, "geolocation", {
        value: {
          getCurrentPosition: (
            _ok: PositionCallback,
            err?: PositionErrorCallback,
          ) => {
            err?.({
              code: 1,
              message: "denied",
              PERMISSION_DENIED: 1,
              POSITION_UNAVAILABLE: 2,
              TIMEOUT: 3,
            } as GeolocationPositionError);
          },
          watchPosition: () => 0,
          clearWatch: () => {},
        },
        configurable: true,
      });
    });

    await page.goto("/");
    await expect(page.getByTestId("geo-banner")).toBeVisible({
      timeout: 10_000,
    });
    await expect(page.getByTestId("geo-banner")).toContainText(
      /Posizione non disponibile/i,
    );
  });
});
