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
});
