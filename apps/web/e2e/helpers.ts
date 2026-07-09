import { type Page, expect } from "@playwright/test";

export async function login(page: Page, email: string, password = "password") {
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: /^sign in$/i }).click();
  await page.waitForURL("/");
}

/** Create a fresh document (isolated per test) and return its id. */
export async function createDocument(page: Page): Promise<string> {
  await page.goto("/");
  await page.getByRole("button", { name: /new document/i }).first().click();
  await page.waitForURL(/\/documents\/[^/]+$/);
  return page.url().split("/").pop()!;
}

/** Grant another user access (via the sharing API, using the caller's session). */
export async function shareDocument(
  page: Page,
  documentId: string,
  email: string,
  role: "EDITOR" | "VIEWER",
) {
  const res = await page.request.post(`/api/documents/${documentId}/access`, {
    data: { email, role },
  });
  expect(res.ok(), `share to ${email} failed (${res.status()})`).toBeTruthy();
}

/** Open a document and wait for the editor to be live. */
export async function openLiveEditor(page: Page, documentId: string) {
  await page.goto(`/documents/${documentId}`);
  const editor = page.locator(".tiptap");
  await editor.waitFor({ state: "visible" });
  await expect(page.getByText("Live")).toBeVisible({ timeout: 20_000 });
  return editor;
}
