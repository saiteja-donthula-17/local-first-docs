import { test, expect } from "@playwright/test";
import { login, createDocument, shareDocument } from "./helpers";

test.describe("document sharing & authorization (Phase 4/8)", () => {
  test("owner grants access; collaborators get in, non-members are blocked", async ({
    browser,
  }) => {
    const ownerCtx = await browser.newContext();
    const editorCtx = await browser.newContext();
    const strangerCtx = await browser.newContext();
    const owner = await ownerCtx.newPage();
    const editor = await editorCtx.newPage();
    const stranger = await strangerCtx.newPage();

    await login(owner, "alice@demo.dev");
    await login(editor, "bob@demo.dev");
    await login(stranger, "carol@demo.dev");

    const doc = await createDocument(owner);
    await shareDocument(owner, doc, "bob@demo.dev", "EDITOR");

    // Owner sees the collaborator in the Share dialog UI.
    await owner.getByRole("button", { name: /^share$/i }).click();
    await expect(owner.getByText("bob@demo.dev")).toBeVisible();
    await owner.keyboard.press("Escape");

    // Shared collaborator can open it (proves access, not a 404), as EDITOR.
    await editor.goto(`/documents/${doc}`);
    await expect(editor.locator(".tiptap")).toBeVisible({ timeout: 20_000 });
    await expect(editor.getByText("EDITOR", { exact: true })).toBeVisible();

    // A logged-in user who was NOT granted access is blocked (tenant isolation).
    const res = await stranger.request.get(`/documents/${doc}`);
    expect(res.status()).toBe(404);

    // Non-owners cannot share (403).
    const forbid = await editor.request.post(`/api/documents/${doc}/access`, {
      data: { email: "carol@demo.dev", role: "VIEWER" },
    });
    expect(forbid.status()).toBe(403);

    await ownerCtx.close();
    await editorCtx.close();
    await strangerCtx.close();
  });
});
