import { test, expect, type Page } from "@playwright/test";

const DOC = "/documents/demo-doc-0001";

async function login(page: Page, email: string, password = "password") {
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: /^sign in$/i }).click();
  await page.waitForURL("/");
}

test.describe("real-time sync (Phase 3)", () => {
  test("two clients editing the same document converge live + see each other's presence", async ({
    browser,
  }) => {
    // Two independent browser contexts = two real users/sessions.
    const ctxA = await browser.newContext();
    const ctxB = await browser.newContext();
    const pageA = await ctxA.newPage();
    const pageB = await ctxB.newPage();

    await login(pageA, "alice@demo.dev"); // OWNER
    await login(pageB, "bob@demo.dev"); // EDITOR

    await pageA.goto(DOC);
    await pageB.goto(DOC);

    const edA = pageA.locator(".tiptap");
    const edB = pageB.locator(".tiptap");
    await edA.waitFor({ state: "visible" });
    await edB.waitFor({ state: "visible" });

    // Both connect to the collab server.
    await expect(pageA.getByText("Live")).toBeVisible({ timeout: 20_000 });
    await expect(pageB.getByText("Live")).toBeVisible({ timeout: 20_000 });

    // Presence: each sees the other's avatar via Yjs awareness.
    await expect(pageA.locator('[title="Bob"]')).toBeVisible({ timeout: 20_000 });
    await expect(pageB.locator('[title="Alice"]')).toBeVisible({ timeout: 20_000 });

    // Alice types → Bob sees it without reloading.
    const fromA = `from-alice-${Date.now()}`;
    await edA.click();
    await pageA.keyboard.type(fromA);
    await expect(edB).toContainText(fromA, { timeout: 20_000 });

    // Bob types → Alice sees it too (bidirectional convergence).
    const fromB = `from-bob-${Date.now()}`;
    await edB.click();
    await pageB.keyboard.type(fromB);
    await expect(edA).toContainText(fromB, { timeout: 20_000 });

    // Both documents now contain both edits — they converged.
    await expect(edA).toContainText(fromA);
    await expect(edB).toContainText(fromB);

    await ctxA.close();
    await ctxB.close();
  });
});
