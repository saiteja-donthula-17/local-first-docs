import { test, expect } from "@playwright/test";
import { login, createDocument, shareDocument, openLiveEditor } from "./helpers";

test.describe("real-time sync (Phase 3)", () => {
  test("two clients editing the same document converge live + see each other's presence", async ({
    browser,
  }) => {
    const ctxA = await browser.newContext();
    const ctxB = await browser.newContext();
    const pageA = await ctxA.newPage();
    const pageB = await ctxB.newPage();

    await login(pageA, "alice@demo.dev"); // OWNER
    await login(pageB, "bob@demo.dev"); // will be EDITOR

    const doc = await createDocument(pageA);
    await shareDocument(pageA, doc, "bob@demo.dev", "EDITOR");

    const edA = await openLiveEditor(pageA, doc);
    const edB = await openLiveEditor(pageB, doc);

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

    // Both documents contain both edits — they converged.
    await expect(edA).toContainText(fromA);
    await expect(edB).toContainText(fromB);

    await ctxA.close();
    await ctxB.close();
  });
});
