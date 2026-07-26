import { expect, test } from "@playwright/test";

test("shows the bootstrap dashboard", async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", {
      name: "Know every component. Validate every connection. Build every display.",
    }),
  ).toBeVisible();
  await expect(page.getByText("Foundation only")).toBeVisible();
});
