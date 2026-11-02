import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { demoProject } from "../project/demoProject";
import { accessibilityViolations } from "../test/axe";
import { ALEX, seedProject, signInAs } from "../test/fakeBackend";
import { routes } from "./routes";

vi.mock("../editor/RoomScene", () => ({ RoomScene: () => <div data-testid="room-scene" /> }));

function renderAt(path: string) {
  render(<RouterProvider router={createMemoryRouter(routes, { initialEntries: [path] })} />);
  return userEvent.setup();
}

describe("accessibility (axe-core)", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => Promise.resolve(Response.json({ status: "ok", version: "1" }))),
    );
  });

  it("does report problems when there are some", async () => {
    render(
      <div>
        <img src="room.png" />
        <button type="button" />
      </div>,
    );

    const violations = await accessibilityViolations();

    expect(violations.map((violation) => violation.split(":")[0])).toEqual(
      expect.arrayContaining(["image-alt", "button-name"]),
    );
  });

  it("finds no problems on the landing page", async () => {
    renderAt("/");
    await screen.findByText(/API online/);

    expect(await accessibilityViolations()).toEqual([]);
  });

  it("finds no problems in the setup wizard", async () => {
    const user = renderAt("/new");
    await user.click(await screen.findByRole("radio", { name: /Bedroom/ }));
    await user.click(screen.getByRole("button", { name: "Next" }));
    await user.click(screen.getByRole("button", { name: "Next" }));
    await screen.findByRole("heading", { name: "Where are the doors and windows?" });

    expect(await accessibilityViolations()).toEqual([]);
  });

  it("finds no problems in the editor, with the assistant and a dialog open", async () => {
    signInAs(ALEX);
    seedProject({ ...demoProject(), id: "room-1" }, ALEX.uid);
    const user = renderAt("/p/room-1");
    await screen.findByRole("heading", { name: "Sunny living room" }, { timeout: 15_000 });

    await user.click(screen.getByRole("button", { name: "Assistant" }));
    await user.click(screen.getByRole("button", { name: "Shopping list" }));

    expect(await accessibilityViolations()).toEqual([]);
  });
});
