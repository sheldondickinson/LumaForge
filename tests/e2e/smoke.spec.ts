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
});
