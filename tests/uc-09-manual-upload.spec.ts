import { test, expect } from "@playwright/test";
import path from "path";
import { ensureAuthenticated } from "./helpers/auth";

test.describe("UC-09: Manual upload workflow", () => {
  test.setTimeout(60_000);

  test("create project, upload images, see grid and export PDF", async ({ page }) => {
    const fixtures = [
      path.join(__dirname, "fixtures", "sample-1.png"),
      path.join(__dirname, "fixtures", "sample-2.png"),
      path.join(__dirname, "fixtures", "sample-3.png"),
    ];

    await ensureAuthenticated(page);

    await page.goto("/projects/new");
    await page.getByTestId("project-name-input").fill("E2E Test Mood Board");
    await page.getByRole("button", { name: "Create project" }).click();

    await expect(page).toHaveURL(/\/projects\/[a-f0-9-]+$/);

    await page.getByTestId("manual-upload-zone").locator('input[type="file"]').setInputFiles(fixtures);
    await expect(page.getByTestId("import-count")).toContainText("3 images", { timeout: 15000 });
    await expect(page.getByTestId("project-grid")).toBeVisible();

    const downloadPromise = page.waitForEvent("download");
    await page.getByTestId("generate-pdf-btn").click();
    const download = await downloadPromise;

    expect(download.suggestedFilename()).toContain("contact-sheet");
    expect(download.suggestedFilename()).toContain(".pdf");
  });
});