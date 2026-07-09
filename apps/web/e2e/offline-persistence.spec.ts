import { test, expect } from "@playwright/test";
import { login, createDocument, shareDocument } from "./helpers";

test.describe("local-first persistence (Phase 2)", () => {
  test("edits survive a reload → IndexedDB is the source of truth", async ({
    page,
  }) => {
    await login(page, "alice@demo.dev");
    await createDocument(page); // navigates to a fresh, isolated doc

    const editor = page.locator(".tiptap");
    await editor.waitFor({ state: "visible" });
    await expect(page.getByText("Saved locally")).toBeVisible();

    const marker = `local-first-${Date.now()}`;
    await editor.click();
    await page.keyboard.type(marker);
    await expect(editor).toContainText(marker);

    await page.reload();
    await expect(page.locator(".tiptap")).toContainText(marker);
  });

  test("edits made while offline are not lost", async ({ page, context }) => {
    await login(page, "alice@demo.dev");
    await createDocument(page);

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

  test("viewer gets a read-only editor (cannot push edits)", async ({
    browser,
  }) => {
    const ownerCtx = await browser.newContext();
    const viewerCtx = await browser.newContext();
    const owner = await ownerCtx.newPage();
    const viewer = await viewerCtx.newPage();

    await login(owner, "alice@demo.dev");
    const doc = await createDocument(owner);
    await shareDocument(owner, doc, "carol@demo.dev", "VIEWER");

    await login(viewer, "carol@demo.dev");
    await viewer.goto(`/documents/${doc}`);
    const editor = viewer.locator(".tiptap");
    await editor.waitFor({ state: "visible" });
    await expect(editor).toHaveAttribute("contenteditable", "false");
    await expect(viewer.getByText("Read-only (Viewer)")).toBeVisible();

    await ownerCtx.close();
    await viewerCtx.close();
  });
});
