import { test, expect, type Page } from "@playwright/test";

const DOC = "/documents/demo-doc-0001";

async function login(page: Page, email: string, password = "password") {
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: /^sign in$/i }).click();
  await page.waitForURL("/");
}

async function openEditor(page: Page) {
  await page.goto(DOC);
  const editor = page.locator(".tiptap");
  await editor.waitFor({ state: "visible" });
  await expect(page.getByText("Live")).toBeVisible({ timeout: 20_000 });
  return editor;
}

test.describe("version history (Phase 5)", () => {
  test("save a version, edit further, then restore — converges on a second client", async ({
    browser,
  }) => {
    const ctxA = await browser.newContext();
    const ctxB = await browser.newContext();
    const pageA = await ctxA.newPage();
    const pageB = await ctxB.newPage();

    await login(pageA, "alice@demo.dev");
    await login(pageB, "bob@demo.dev");

    const edA = await openEditor(pageA);
    const edB = await openEditor(pageB);

    // Establish a known baseline both clients agree on.
    const marker = `v1-${Date.now()}`;
    await edA.click();
    await pageA.keyboard.type(marker);
    await expect(edB).toContainText(marker, { timeout: 20_000 });

    // Alice saves this as a version.
    await pageA.getByRole("button", { name: /history/i }).click();
    await pageA.getByRole("button", { name: /save current version/i }).click();
    await pageA.getByPlaceholder("e.g. First draft").fill("baseline");
    await pageA.getByRole("button", { name: /^save$/i }).click();
    await expect(pageA.getByText("Version saved")).toBeVisible({ timeout: 15_000 });
    await pageA.keyboard.press("Escape"); // close the history sheet

    // Both clients edit further.
    const extra = ` extra-${Date.now()}`;
    await edA.click();
    await pageA.keyboard.press("End");
    await pageA.keyboard.type(extra);
    await expect(edB).toContainText(extra, { timeout: 20_000 });

    // Alice reopens history and restores the newest ("baseline") version.
    await pageA.getByRole("button", { name: /history/i }).click();
    await pageA.getByRole("button", { name: /^restore$/i }).first().click();
    await expect(pageA.getByText(/restored/i)).toBeVisible({ timeout: 15_000 });

    // Both converge back to the baseline; the later edit is gone everywhere.
    await expect(edA).toContainText(marker);
    await expect(edA).not.toContainText(extra.trim());
    await expect(edB).toContainText(marker, { timeout: 20_000 });
    await expect(edB).not.toContainText(extra.trim(), { timeout: 20_000 });

    await ctxA.close();
    await ctxB.close();
  });
});
