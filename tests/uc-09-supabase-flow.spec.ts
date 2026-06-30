import { test, expect } from "@playwright/test";
import path from "path";

test.describe("UC-09 with Supabase auth + persistence", () => {
  test.setTimeout(60_000);

  test("signup, create project, upload, refresh persists", async ({ page }) => {
    const email = `e2e-${Date.now()}@inspogrid.test`;
    const password = "testpass123";
    const fixtures = [
      path.join(__dirname, "fixtures", "sample-1.png"),
      path.join(__dirname, "fixtures", "sample-2.png"),
    ];

    await page.goto("/signup");
    await page.getByTestId("signup-email").fill(email);
    await page.getByTestId("signup-password").fill(password);
    await page.getByRole("button", { name: "Get started free" }).click();

    await expect(page).toHaveURL(/\/dashboard/, { timeout: 15000 });

    await page.getByTestId("new-project-btn").click();
    await page.getByTestId("project-name-input").fill("Supabase E2E Board");
    await page.getByRole("button", { name: "Create project" }).click();

    await expect(page).toHaveURL(/\/projects\/[a-f0-9-]+$/);
    const projectUrl = page.url();

    await page.getByTestId("manual-upload-zone").locator('input[type="file"]').setInputFiles(fixtures);
    await expect(page.getByTestId("import-count")).toContainText("2 images", { timeout: 15000 });

    await page.reload();
    await expect(page.getByTestId("import-count")).toContainText("2 images", { timeout: 15000 });
    await expect(page).toHaveURL(projectUrl);
  });
});