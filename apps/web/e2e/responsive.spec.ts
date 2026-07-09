import { test, expect, type Page } from "@playwright/test";
import { login, createDocument } from "./helpers";

const MOBILE = { width: 390, height: 844 }; // iPhone-ish

async function assertNoHorizontalOverflow(page: Page, where: string) {
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - window.innerWidth,
  );
  expect(overflow, `${where} overflows horizontally by ${overflow}px`).toBeLessThanOrEqual(1);
}

test.describe("responsive layout (mobile)", () => {
  test.use({ viewport: MOBILE });

  test("login, dashboard, and editor fit the mobile viewport", async ({
    page,
  }) => {
    await page.goto("/login");
    await expect(page.getByRole("button", { name: /^sign in$/i })).toBeVisible();
    await assertNoHorizontalOverflow(page, "login");

    await login(page, "alice@demo.dev");
    await assertNoHorizontalOverflow(page, "dashboard");

    await createDocument(page);
    await page.locator(".tiptap").waitFor({ state: "visible" });
    await assertNoHorizontalOverflow(page, "editor");
  });
});
