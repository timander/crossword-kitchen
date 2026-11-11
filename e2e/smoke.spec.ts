import { expect, test, type Page } from "@playwright/test";

/** Fails the test on any console error, uncaught exception, or CSP violation. */
function watchForErrors(page: Page) {
  const errors: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(msg.text());
  });
  page.on("pageerror", (err) => errors.push(err.message));
  return errors;
}

const pdfPages = (pdf: Buffer) => (pdf.toString("latin1").match(/\/Type\s*\/Page[^s]/g) ?? []).length;

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await expect(page.locator(".cell.letter").first()).toBeVisible();
});

test("loads with a strict CSP and no errors, and plays a word", async ({ page }) => {
  const errors = watchForErrors(page);
  await page.reload();
  const csp = await page.locator('meta[http-equiv="Content-Security-Policy"]').getAttribute("content");
  expect(csp).toContain("default-src 'none'");
  expect(csp).toContain("require-trusted-types-for 'script'");
  await expect(page.locator("#editor")).toBeHidden();

  await page.locator(".clues li").first().click();
  const answer = (await page.locator(".clues li .ans").first().textContent())?.replace(/[^A-Z]/g, "") ?? "";
  await page.keyboard.type(answer.toLowerCase());
  await expect(page.locator(".clues li").first()).toHaveClass(/done/);

  await page.getByRole("button", { name: "✔ Check" }).click();
  await expect(page.locator("#toast")).toContainText("So far so good");
  expect(errors).toEqual([]);
});

test("regenerates, reveals answers, and remembers state across reloads", async ({ page }) => {
  await page.getByRole("button", { name: /Regenerate/ }).click();
  await expect(page.locator("#toast")).toContainText("Fresh layout");
  await page.getByRole("button", { name: /Answers/ }).click();
  await expect(page.locator(".key-badge")).toHaveText("Answer Key");

  await page.locator("#toggle-editor").click();
  await page.locator("#title").fill("Saved Title");
  await page.reload();
  await expect(page.locator(".sheet-title, #sheet h1").first()).toContainText("Saved Title");
  await expect(page.locator("#editor")).toBeHidden();
});

test("prints the puzzle and the key on exactly one page each", async ({ page, browserName }, testInfo) => {
  test.skip(browserName !== "chromium" || testInfo.project.name !== "desktop", "PDF output needs desktop Chromium");
  await page.emulateMedia({ media: "print" });
  expect(pdfPages(await page.pdf({ preferCSSPageSize: true }))).toBe(1);

  await page.emulateMedia({ media: "screen" });
  await page.getByRole("button", { name: /Answers/ }).click();
  await page.locator("#toggle-editor").click();
  await page.locator("#bank-select").selectOption("pro-michelin-kitchen");
  await page.getByRole("button", { name: "Load" }).click();
  await page.locator("#opt-bank").check();
  await page.emulateMedia({ media: "print" });
  expect(pdfPages(await page.pdf({ preferCSSPageSize: true }))).toBe(1);
});

test("opens and closes the editor", async ({ page }) => {
  const panel = page.locator("#editor");
  await expect(panel).toBeHidden();
  await page.locator("#toggle-editor").click();
  await expect(panel).toBeVisible();
  await page.getByRole("button", { name: "Done" }).click();
  await expect(panel).toBeHidden();
  await page.locator("#toggle-editor").click();
  await page.keyboard.press("Escape");
  await expect(panel).toBeHidden();
});

test("fits a phone screen and is playable by tapping", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "phone", "phone layout only");
  await expect(page.locator("body")).toHaveClass(/compact/);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(0);

  const firstCell = page.locator(".cell.letter input").first();
  const box = await firstCell.boundingBox();
  expect(box?.width).toBeGreaterThanOrEqual(20);

  // The puzzle comes first; the editor opens as a drawer over it and closes with a tap outside.
  await expect(page.locator("#editor")).toBeHidden();
  await page.locator("#toggle-editor").click();
  await expect(page.locator("#editor")).toBeVisible();
  const width = page.viewportSize()?.width ?? 0;
  await page.mouse.click(width - 10, 300);
  await expect(page.locator("#editor")).toBeHidden();
  await firstCell.tap();
  await page.keyboard.type("x");
  await expect(firstCell).toHaveValue("X");
  await page.screenshot({ path: testInfo.outputPath("phone.png"), fullPage: false });
});
