import { test, expect } from "@playwright/test";

const ADMIN_EMAIL = "admin@arche-cms.com";
const ADMIN_PW = "admin123";

async function login(page: import("@playwright/test").Page) {
  await page.goto("login");
  if (await page.getByLabel("Email").isVisible()) {
    await page.getByLabel("Email").fill(ADMIN_EMAIL);
    await page.getByLabel("Password").fill(ADMIN_PW);
    await page.getByRole("button", { name: "Sign In" }).click();
  }
  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible({ timeout: 15000 });
}

async function createEntry(page: import("@playwright/test").Page, slug: string, title: string) {
  await page.goto(`collections/new/${slug}`);
  await expect(page.getByRole("heading", { name: /New / })).toBeVisible();
  await page.getByLabel("Title*").fill(title);
  await page.getByRole("button", { name: "Save" }).click();
  await expect(page.getByText("Entry created")).toBeVisible({ timeout: 10000 });
  const idText = await page.getByText(/ID: /).textContent();
  return idText?.replace("ID: ", "").trim() ?? "";
}

// ── Analytics (disabled in playground config) ──

test.describe("Analytics capability (disabled)", () => {
  test("dashboard shows disabled notice when analytics is off", async ({ page }) => {
    await login(page);
    await expect(page.getByText("Analytics is disabled for this project.")).toBeVisible();
  });

  test("analytics nav link is hidden when disabled", async ({ page }) => {
    await login(page);
    await expect(page.getByRole("link", { name: "Analytics" })).toHaveCount(0);
  });

  test("analytics route shows disabled notice", async ({ page }) => {
    await login(page);
    await page.goto("analytics");
    await expect(page.getByRole("heading", { name: "Analytics is disabled" })).toBeVisible();
  });
});

// ── Versioning (disabled for `date`, enabled for `posts`) ──

test.describe("Versioning capability", () => {
  test("version history hidden when versioning is disabled for a collection", async ({ page }) => {
    await login(page);
    const id = await createEntry(page, "date", `E2E versioning ${Date.now()}`);
    await expect(page.getByRole("button", { name: "Version History" })).toHaveCount(0);
    await page.goto(`collections/date/${id}/revisions`);
    await expect(page.getByRole("heading", { name: "Version history is disabled" })).toBeVisible();
  });

  test("version history shown when versioning is enabled for a collection", async ({ page }) => {
    await login(page);
    await createEntry(page, "posts", `E2E versions ${Date.now()}`);
    await expect(page.getByRole("link", { name: "Version History" })).toBeVisible();
    await page.getByRole("link", { name: "Version History" }).click();
    await expect(page.getByRole("heading", { name: /Revisions/ })).toBeVisible();
  });
});

// ── Workflow (enabled by default, defined on `posts`) ──

test.describe("Workflow capability", () => {
  test("workflow panel shown when enabled", async ({ page }) => {
    await login(page);
    await createEntry(page, "posts", `E2E workflow ${Date.now()}`);
    await expect(page.getByRole("heading", { name: "Workflow" })).toBeVisible();
  });
});

// ── RBAC (enabled) ──

test.describe("RBAC capability", () => {
  test("users and roles nav links visible when enabled", async ({ page }) => {
    await login(page);
    await expect(page.getByRole("link", { name: "Users" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Roles" })).toBeVisible();
  });
});

// ── Media (enabled) ──

test.describe("Media capability", () => {
  test("media nav link visible when enabled", async ({ page }) => {
    await login(page);
    await expect(page.getByRole("link", { exact: true, name: "Media" })).toBeVisible();
  });
});
