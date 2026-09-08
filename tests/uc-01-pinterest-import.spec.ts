import { test, expect } from "@playwright/test";
import { ensureAuthenticated } from "./helpers/auth";

test.describe("UC-01: Pinterest extension import (Approach B)", () => {
  test.setTimeout(60_000);

  test("authenticated user can list projects and import pins via API (simulates extension)", async ({ page, request }) => {
    await ensureAuthenticated(page);

    // Create a target project via UI (simulates real flow)
    await page.goto("/projects/new");
    await page.getByTestId("project-name-input").fill("Pinterest Import Test");
    await page.getByRole("button", { name: "Create project" }).click();
    await expect(page).toHaveURL(/\/projects\/[a-f0-9-]+$/);

    // Extract project id from URL
    const url = page.url();
    const projectIdMatch = url.match(/\/projects\/([a-f0-9-]+)/);
    const projectId = projectIdMatch ? projectIdMatch[1] : null;
    expect(projectId).toBeTruthy();

    // Use Playwright request context (inherits cookies from page) to call the import endpoint
    // This mirrors what the extension does after obtaining the session via /api/extension/session
    const pins = [
      { title: "Test Pin 1", imageUrl: "https://i.pinimg.com/736x/ab/cd/ef/test1.jpg", sourceUrl: "https://www.pinterest.com/pin/1/" },
      { title: "Test Pin 2", imageUrl: "https://i.pinimg.com/736x/12/34/56/test2.jpg", sourceUrl: "https://www.pinterest.com/pin/2/" },
    ];

    const importRes = await request.post("/api/extension/import", {
      data: {
        platform: "pinterest",
        boardName: "Test Board",
        projectId,
        pins,
      },
    });

    expect(importRes.ok()).toBeTruthy();
    const body = await importRes.json();
    expect(body.ok).toBe(true);
    expect(body.imported).toBe(2);
    expect(body.projectId).toBe(projectId);

    // Verify images are now in the project
    await page.reload();
    await expect(page.getByTestId("import-count")).toContainText("2 images", { timeout: 15000 });
  });

  test("rejects import without auth (401)", async ({ request }) => {
    const res = await request.post("/api/extension/import", {
      data: { platform: "pinterest", projectId: "00000000-0000-0000-0000-000000000000", pins: [{ title: "x", imageUrl: "https://ex.com/1.jpg" }] },
    });
    expect(res.status()).toBe(401);
  });

  test("/api/extension/session returns 401 when unauthenticated", async ({ request }) => {
    const res = await request.get("/api/extension/session");
    expect(res.status()).toBe(401);
  });

  test("requires projectId and non-empty pins (400)", async ({ page, request }) => {
    await ensureAuthenticated(page);

    const bad1 = await request.post("/api/extension/import", { data: { platform: "pinterest", pins: [] } });
    expect(bad1.status()).toBe(400);

    const bad2 = await request.post("/api/extension/import", { data: { platform: "pinterest", projectId: "x", pins: [] } });
    expect(bad2.status()).toBe(400);
  });
});
