import { expect, test, type Page } from "@playwright/test";

/** Uncaught errors on the page; the test fails on any of them. */
function collectPageErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  return errors;
}

test("describe a room, furnish it, and share it", async ({ page, browser }) => {
  const errors = collectPageErrors(page);
  await page.goto("/");
  await page.getByRole("link", { name: "Start a new room" }).click();

  await test.step("describe the room in the wizard", async () => {
    const next = page.getByRole("button", { name: "Next" });
    await page.getByRole("radio", { name: /Living room/ }).check({ force: true });
    await next.click();
    await page.getByRole("textbox", { name: "Width (west to east)" }).fill("5");
    await page.getByRole("textbox", { name: "Depth (north to south)" }).fill("4");
    await next.click();
    await page.getByRole("button", { name: "Add a window" }).click();
    await page
      .getByRole("region", { name: "Window 1" })
      .getByRole("textbox", { name: "From the north-west corner" })
      .fill("1");
    await next.click();
    await page.getByRole("radio", { name: /Scandinavian/ }).check({ force: true });
    await next.click();
    await page.getByLabel("Furniture budget (USD)").fill("2500");
    await next.click();
    await page.getByRole("textbox", { name: "Room name" }).fill("Reading room");
    await page.getByRole("button", { name: "Create room" }).click();
  });

  await test.step("follow the tour and furnish the room", async () => {
    await expect(page.getByRole("heading", { name: "Reading room", level: 1 })).toBeVisible();
    await expect(page.locator("canvas")).toBeVisible();

    const tour = page.getByRole("dialog", { name: "Add furniture" });
    await expect(tour).toBeVisible();
    for (let step = 0; step < 3; step++) await page.getByRole("button", { name: "Next" }).click();
    await page.getByRole("button", { name: "Done" }).click();
    await expect(page.getByText(/Getting started/)).toBeHidden();

    await page.getByRole("button", { name: "Add three-seat sofa" }).click();
    await page.getByRole("button", { name: "Add coffee table" }).click();
    await expect(page.getByRole("tab", { name: "In room (2)" })).toBeVisible();

    await page.getByRole("button", { name: "Undo" }).click();
    await expect(page.getByRole("tab", { name: "In room (1)" })).toBeVisible();
    await page.getByRole("button", { name: "Redo" }).click();
    await expect(page.getByRole("tab", { name: "In room (2)" })).toBeVisible();
    await expect(page.getByText(/^Saved/)).toBeVisible();
  });

  await test.step("the room is still there after a reload", async () => {
    await page.reload();
    await expect(page.getByRole("heading", { name: "Reading room", level: 1 })).toBeVisible();
    await expect(page.getByRole("tab", { name: "In room (2)" })).toBeVisible();
    // The tour was finished once and does not come back.
    await expect(page.getByText(/Getting started/)).toBeHidden();
  });

  await test.step("check the shopping list", async () => {
    await page.getByRole("button", { name: "Shopping list" }).click();
    const list = page.getByRole("dialog", { name: "Shopping list" });
    await expect(list).toContainText("Three-seat sofa");
    await expect(list).toContainText("Coffee table");
    await list.getByRole("button", { name: "Close" }).click();
  });

  const link = await test.step("publish a share link", async () => {
    await page.getByRole("button", { name: "Share" }).click();
    const dialog = page.getByRole("dialog", { name: "Share this room" });
    await dialog.getByRole("button", { name: "Create a share link" }).click();
    const value = await dialog.getByRole("textbox", { name: "Share link" }).inputValue();
    await dialog.getByRole("button", { name: "Close" }).click();
    return value;
  });

  await test.step("the room is listed in My rooms", async () => {
    await page.getByRole("link", { name: "My rooms" }).click();
    await expect(page.getByRole("heading", { name: "My rooms" })).toBeVisible();
    await expect(page.getByRole("listitem").filter({ hasText: "Reading room" })).toBeVisible();
  });

  await test.step("someone without an account opens the share link", async () => {
    const visitor = await browser.newContext({ locale: "en-GB" });
    const viewer = await visitor.newPage();
    const visitorErrors = collectPageErrors(viewer);
    await viewer.goto(link);
    await expect(viewer.getByRole("heading", { name: "Reading room", level: 1 })).toBeVisible();
    await expect(viewer.getByText(/Shared plan · Published/)).toBeVisible();
    await expect(viewer.locator("canvas")).toBeVisible();
    await visitor.close();
    expect(visitorErrors).toEqual([]);
  });

  expect(errors).toEqual([]);
});
