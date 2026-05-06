import { test, expect } from "@playwright/test";

/**
 * E2E per US-006 — Ricerca per indirizzo.
 *
 * Skippato senza NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN: la mappa Mapbox non si carica
 * senza token e il filtro per raggio non può essere verificato dal DOM dei pin.
 */

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;

const LISTINGS_PAYLOAD = {
  listings: [
    {
      id: "near-1",
      title: "Bagno del Cortile",
      addressDisplay: "Centro Storico",
      latitude: 41.901,
      longitude: 12.481,
      hourlyPriceCents: 350,
      hostType: "PRIVATE",
      photoUrl: null,
    },
    {
      id: "near-2",
      title: "Caffè Centrale",
      addressDisplay: "Centro Storico",
      latitude: 41.9015,
      longitude: 12.4815,
      hourlyPriceCents: 200,
      hostType: "BUSINESS",
      photoUrl: null,
    },
    {
      id: "far-1",
      title: "Trastevere Bagno",
      addressDisplay: "Trastevere",
      latitude: 41.85,
      longitude: 12.45,
      hourlyPriceCents: 300,
      hostType: "PRIVATE",
      photoUrl: null,
    },
  ],
};

const GEOCODE_PAYLOAD = {
  results: [
    {
      id: "address.1",
      label: "Via del Corso 100, 00186 Roma RM, Italia",
      addressDisplay: "Centro Storico, Roma",
      latitude: 41.901,
      longitude: 12.481,
    },
    {
      id: "address.2",
      label: "Via del Corso 281, 00186 Roma RM, Italia",
      addressDisplay: "Piazza Colonna, Roma",
      latitude: 41.9,
      longitude: 12.481,
    },
  ],
};

test.describe("US-006 address search", () => {
  test.skip(
    !MAPBOX_TOKEN,
    "Set NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN to run the address search e2e suite",
  );

  test.beforeEach(async ({ context }) => {
    await context.grantPermissions(["geolocation"]);
    await context.setGeolocation({ latitude: 41.9028, longitude: 12.4964 });
  });

  test("happy path: type → dropdown → select → pill + filtered pins", async ({
    page,
  }) => {
    await page.route("**/api/listings/map", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(LISTINGS_PAYLOAD),
      }),
    );
    await page.route("**/api/geocode/search**", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(GEOCODE_PAYLOAD),
      }),
    );

    await page.goto("/");
    await expect(page.getByTestId("map-view")).toBeVisible();

    const input = page.getByTestId("address-search-input");
    await input.fill("Via del Corso");

    const listbox = page.getByTestId("address-search-listbox");
    await expect(listbox).toBeVisible();
    const results = page.getByTestId("address-search-result");
    await expect(results).toHaveCount(2);

    await results.first().click();

    await expect(page.getByTestId("search-pill")).toBeVisible();
    await expect(page.getByTestId("search-pill")).toContainText(
      /Centro Storico/i,
    );

    // Wait for the map to settle and verify only the listings inside 1 km remain.
    await expect.poll(
      async () =>
        await page.locator('[data-testid="map-pin"]').count(),
      { timeout: 10_000 },
    ).toBeGreaterThan(0);
    const pinIds = await page
      .locator('[data-testid="map-pin"]')
      .evaluateAll((els) => els.map((e) => (e as HTMLElement).dataset.listingId));
    expect(pinIds).not.toContain("far-1");
  });

  test('"Usa la mia posizione" clears the search and re-geolocates', async ({
    page,
  }) => {
    await page.route("**/api/listings/map", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(LISTINGS_PAYLOAD),
      }),
    );
    await page.route("**/api/geocode/search**", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(GEOCODE_PAYLOAD),
      }),
    );

    await page.goto("/");
    await page.getByTestId("address-search-input").fill("Via del Corso");
    await page.getByTestId("address-search-result").first().click();
    await expect(page.getByTestId("search-pill")).toBeVisible();

    await page.getByTestId("address-search-locate").click();
    await expect(page.getByTestId("search-pill")).toBeHidden();
  });

  test("empty radius shows a sonner toast", async ({ page }) => {
    // Geocode result is far from all listings → 0 within 1 km.
    await page.route("**/api/listings/map", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(LISTINGS_PAYLOAD),
      }),
    );
    await page.route("**/api/geocode/search**", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          results: [
            {
              id: "address.far",
              label: "Milano Centrale, Milano, Italia",
              addressDisplay: "Centrale, Milano",
              latitude: 45.4848,
              longitude: 9.2046,
            },
          ],
        }),
      }),
    );

    await page.goto("/");
    await page.getByTestId("address-search-input").fill("Milano");
    await page.getByTestId("address-search-result").first().click();

    await expect(
      page.locator("[data-sonner-toast]").filter({
        hasText: /Nessun bagno nel raggio di 1 km/i,
      }),
    ).toBeVisible({ timeout: 10_000 });
  });

  test("keyboard navigation: ↓ ↓ Enter selects the second result", async ({
    page,
  }) => {
    await page.route("**/api/listings/map", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(LISTINGS_PAYLOAD),
      }),
    );
    await page.route("**/api/geocode/search**", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(GEOCODE_PAYLOAD),
      }),
    );

    await page.goto("/");
    const input = page.getByTestId("address-search-input");
    await input.fill("Via del Corso");
    await expect(page.getByTestId("address-search-listbox")).toBeVisible();

    await input.press("ArrowDown"); // wraps from initial active=0 to 1
    await input.press("Enter");

    await expect(page.getByTestId("search-pill")).toBeVisible();
    await expect(page.getByTestId("search-pill")).toContainText(/Piazza Colonna/i);

    // Esc closes the dropdown after re-focusing.
    await input.click();
    await input.press("Escape");
    await expect(page.getByTestId("address-search-listbox")).toBeHidden();
  });
});
