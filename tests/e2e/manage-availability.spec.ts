import { test, expect, Page } from "@playwright/test";

/**
 * E2E per US-003 — Gestione disponibilità settimanale.
 *
 * Pre-requisiti runtime:
 *  - E2E_USER_EMAIL / E2E_USER_PASSWORD: utente Supabase Auth con almeno
 *    un listing in DB.
 *
 * Skippato di default per evitare false negative in CI senza queste env.
 */

const E2E_USER_EMAIL = process.env.E2E_USER_EMAIL;
const E2E_USER_PASSWORD = process.env.E2E_USER_PASSWORD;

// Grid layout constants (must match availability-editor.tsx)
const START_HOUR = 6;

function row(hour: number): number {
  return (hour - START_HOUR) * 2;
}

async function paintRange(
  page: Page,
  day: number,
  fromHour: number,
  toHour: number,
) {
  const rStart = row(fromHour);
  const rEnd = row(toHour) - 1;
  const startCell = page.getByTestId(`av-cell-${day}-${rStart}`);
  await startCell.scrollIntoViewIfNeeded();
  const startBox = await startCell.boundingBox();
  if (!startBox) throw new Error("start cell not visible");

  const endCell = page.getByTestId(`av-cell-${day}-${rEnd}`);
  const endBox = await endCell.boundingBox();
  if (!endBox) throw new Error("end cell not visible");

  await page.mouse.move(
    startBox.x + startBox.width / 2,
    startBox.y + startBox.height / 2,
  );
  await page.mouse.down();
  await page.mouse.move(
    endBox.x + endBox.width / 2,
    endBox.y + endBox.height / 2,
    { steps: 12 },
  );
  await page.mouse.up();
}

test.describe("US-003 manage availability", () => {
  test.skip(
    !E2E_USER_EMAIL || !E2E_USER_PASSWORD,
    "Set E2E_USER_EMAIL and E2E_USER_PASSWORD to run the e2e suite",
  );

  test("host trascina per impostare la disponibilità e i valori restano dopo il reload", async ({
    page,
  }) => {
    await page.goto("/auth/signin");
    await page.getByLabel("Email").fill(E2E_USER_EMAIL!);
    await page.getByLabel("Password").fill(E2E_USER_PASSWORD!);
    await page.getByRole("button", { name: "Accedi" }).click();
    await expect(page).toHaveURL(/\/dashboard/);

    await page.goto("/host/dashboard");
    await page.getByTestId("manage-availability-link").first().click();
    await expect(
      page.getByRole("heading", { name: /Quando ti trovano/i }),
    ).toBeVisible();

    // Start clean
    await page.getByTestId("availability-clear").click();

    // Lun 9–13, Mer 18–22
    await paintRange(page, 0, 9, 13);
    await paintRange(page, 2, 18, 22);

    await page.getByTestId("availability-save").click();
    await expect(page.getByText(/Disponibilità aggiornata/i)).toBeVisible({
      timeout: 10_000,
    });

    await page.reload();

    // Cells must persist
    await expect(
      page.getByTestId(`av-cell-0-${row(9)}`),
    ).toHaveAttribute("data-active", "1");
    await expect(
      page.getByTestId(`av-cell-0-${row(13) - 1}`),
    ).toHaveAttribute("data-active", "1");
    await expect(
      page.getByTestId(`av-cell-0-${row(13)}`),
    ).toHaveAttribute("data-active", "0");
    await expect(
      page.getByTestId(`av-cell-2-${row(18)}`),
    ).toHaveAttribute("data-active", "1");
    await expect(
      page.getByTestId(`av-cell-2-${row(22) - 1}`),
    ).toHaveAttribute("data-active", "1");
  });
});
