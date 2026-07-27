import { expect, test } from "@playwright/test";

test("protects the dashboard with local administrator sign-in", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\/login$/);
  await expect(
    page.getByRole("heading", {
      name: "Sign in",
    }),
  ).toBeVisible();

  const email = process.env.E2E_ADMIN_EMAIL;
  const password = process.env.E2E_ADMIN_PASSWORD;

  if (!email || !password) {
    return;
  }

  await page.getByLabel("Email address").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();

  await expect(page).toHaveURL("/");
  await expect(
    page.getByRole("heading", {
      name: "Know every component. Validate every connection. Build every display.",
    }),
  ).toBeVisible();
  await expect(page.getByText("Foundation only")).toBeVisible();
  await expect(page.getByText(email)).toBeVisible();

  await page.getByRole("link", { name: "Products" }).click();
  await page.getByRole("link", { name: "Create product" }).click();
  await page
    .getByLabel("Asset class")
    .selectOption({ label: "Pixel string (PX)" });
  await page.getByLabel("Product name").fill("12 V WS2811 bullet pixel string");
  await page.getByLabel("Manufacturer").fill("E2E Pixels");
  await page.getByLabel("Model").fill("E2E-100");
  await page.getByLabel("Voltage (V)").fill("12");
  await page.getByLabel("Pixel count").fill("100");
  await page.getByLabel("Spacing (mm)").fill("100");
  await page.getByLabel("Protocol").fill("WS2811");
  await page.getByLabel("Connector").fill("xConnect");
  await page.getByRole("button", { name: "Create product" }).click();

  await expect(
    page.getByRole("heading", {
      name: "12 V WS2811 bullet pixel string",
      exact: true,
    }),
  ).toBeVisible();
  await expect(page.getByText("Revision 1", { exact: true })).toBeVisible();

  await page.getByRole("link", { name: "Assets" }).click();
  await page.getByRole("link", { name: "Create assets" }).click();
  await page
    .getByLabel("Product revision")
    .selectOption({ label: "12 V WS2811 bullet pixel string — revision 1" });
  await page.getByLabel("Quantity").fill("2");
  await page.getByLabel("Friendly name base").fill("Front fence pixels");
  await page.getByRole("button", { name: "Create assets" }).click();

  await expect(page).toHaveURL("/assets");
  await expect(page.getByText("PX-000001")).toBeVisible();
  await expect(page.getByText("PX-000002")).toBeVisible();
  await expect(page.getByText("Front fence pixels 1")).toBeVisible();
  await expect(page.getByText("Front fence pixels 2")).toBeVisible();

  const createLocation = async ({
    type,
    code,
    name,
    parentCode,
  }: {
    type: string;
    code: string;
    name: string;
    parentCode?: string;
  }) => {
    await page.getByRole("link", { name: "Locations" }).click();
    await page.getByRole("link", { name: "Create location" }).click();
    await page.getByLabel("Location type").selectOption(type);
    if (parentCode) {
      const parentValue = await page
        .getByLabel("Parent location")
        .locator("option")
        .filter({ hasText: parentCode })
        .getAttribute("value");
      await page.getByLabel("Parent location").selectOption(parentValue!);
    }
    await page.getByLabel("Permanent location code").fill(code);
    await page.getByLabel("Friendly name").fill(name);
    await page.getByRole("button", { name: "Create location" }).click();
    await expect(page).toHaveURL("/locations");
    await expect(page.getByText(code, { exact: true })).toBeVisible();
  };

  await createLocation({
    type: "shed",
    code: "SHED-01",
    name: "Display shed",
  });
  await createLocation({
    type: "rack",
    code: "RACK-01",
    name: "Pixel rack",
    parentCode: "SHED-01",
  });
  await createLocation({
    type: "shelf",
    code: "SHELF-01",
    name: "Pixel shelf",
    parentCode: "RACK-01",
  });
  await createLocation({
    type: "tote",
    code: "TOTE-01",
    name: "Pixel tote",
    parentCode: "SHELF-01",
  });

  for (const assetIdentifier of ["PX-000001", "PX-000002"]) {
    await page.getByRole("link", { name: "Assets" }).click();
    await page
      .getByRole("link", { name: assetIdentifier, exact: true })
      .click();
    const toteValue = await page
      .getByLabel("Destination")
      .locator("option")
      .filter({ hasText: "TOTE-01" })
      .getAttribute("value");
    await page.getByLabel("Destination").selectOption(toteValue!);
    await page
      .getByLabel("Movement reason")
      .fill("Packed after display testing");
    await page.getByRole("button", { name: "Move asset" }).click();
    await expect(page.getByText("TOTE-01 · Pixel tote").first()).toBeVisible();
  }

  await page.getByRole("link", { name: "Assets" }).click();
  await page.getByRole("link", { name: "PX-000001", exact: true }).click();
  await page.getByRole("link", { name: "Print QR and Code 128 label" }).click();
  await expect(page.getByAltText("QR code for PX-000001")).toBeVisible();
  await expect(page.getByText("/scan/assets/PX-000001")).toBeVisible();

  await page.goto("/scan/assets/PX-000001");
  await expect(page).toHaveURL(/\/assets\/[0-9a-f-]+$/);
  await expect(
    page.getByRole("heading", { name: "PX-000001", exact: true }),
  ).toBeVisible();

  await page.getByRole("link", { name: "Stocktakes" }).click();
  await page.getByRole("link", { name: "Start stocktake" }).click();
  const shedValue = await page
    .getByLabel("Location scope")
    .locator("option")
    .filter({ hasText: "SHED-01" })
    .getAttribute("value");
  await page.getByLabel("Location scope").selectOption(shedValue!);
  await page.getByLabel("Stocktake name").fill("E2E post-season shed count");
  await page.getByRole("button", { name: "Start stocktake" }).click();
  await page.getByLabel("Asset ID").fill("PX-000001");
  await page.getByRole("button", { name: "Record asset" }).click();
  await expect(page.getByText("PX-000001 recorded.")).toBeVisible();
  await page.getByRole("button", { name: "Complete stocktake" }).click();
  await expect(page.getByText("Completed", { exact: true })).toBeVisible();
  await expect(page.getByText("1 scanned · 1 missing")).toBeVisible();
});
