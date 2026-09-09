import type { Page } from "@playwright/test";

/** Sign up if middleware redirected to login (Supabase mode). No-op in demo mode. */
export async function ensureAuthenticated(page: Page) {
  await page.goto("/dashboard");
  if (!page.url().includes("/login")) return;

  const email = `e2e-${Date.now()}@inspogrid.test`;
  const password = "testpass123";

  await page.goto("/signup");
  await page.getByTestId("signup-email").fill(email);
  await page.getByTestId("signup-password").fill(password);
  const confirm = page.getByTestId("signup-password-confirm");
  if (await confirm.count()) {
    await confirm.fill(password);
  }
  await page.getByRole("button", { name: "Get started free" }).click();
  await page.waitForURL(/\/dashboard/, { timeout: 15000 });
}
