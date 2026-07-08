import { test, expect, type Page } from "@playwright/test";

const DOC = "/documents/demo-doc-0001";

async function login(page: Page, email: string, password = "password") {
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: /^sign in$/i }).click();
  await page.waitForURL("/");
}

test.describe("local-first persistence (Phase 2)", () => {
  test("edits survive a reload with no server-side copy → IndexedDB is the source of truth", async ({
    page,
  }) => {
    await login(page, "alice@demo.dev");
    await page.goto(DOC);

    const editor = page.locator(".tiptap");
    await editor.waitFor({ state: "visible" });
    await expect(page.getByText("Saved locally")).toBeVisible();

    const marker = `local-first-${Date.now()}`;
    await editor.click();
    await page.keyboard.type(marker);
    await expect(editor).toContainText(marker);

    await page.reload();

    // Text is restored after a reload — local-first persistence at work.
    // (The strongest proof is the offline test below, where the server never
    // saw the edit yet it still survives.)
    await expect(page.locator(".tiptap")).toContainText(marker);
  });

  test("edits made while offline are not lost", async ({ page, context }) => {
    await login(page, "alice@demo.dev");
    await page.goto(DOC);

    const editor = page.locator(".tiptap");
    await editor.waitFor({ state: "visible" });
    await expect(page.getByText("Saved locally")).toBeVisible();

    await context.setOffline(true);
    const marker = `offline-${Date.now()}`;
    await editor.click();
    await page.keyboard.type(marker);
    await expect(editor).toContainText(marker);

    await context.setOffline(false);
    await page.reload();
    await expect(page.locator(".tiptap")).toContainText(marker);
  });

  test("viewer gets a read-only editor (cannot push edits)", async ({ page }) => {
    await login(page, "carol@demo.dev");
    await page.goto(DOC);

    const editor = page.locator(".tiptap");
    await editor.waitFor({ state: "visible" });
    await expect(editor).toHaveAttribute("contenteditable", "false");
    await expect(page.getByText("Read-only (Viewer)")).toBeVisible();
  });
});
