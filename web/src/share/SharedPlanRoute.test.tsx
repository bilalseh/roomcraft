import { render, screen } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router";
import { describe, expect, it, vi } from "vitest";
import { demoProject } from "../project/demoProject";
import { shares } from "../test/fakeBackend";
import { SharedPlanError } from "./SharedPlanError";
import { sharedPlanLoader } from "./sharedPlanLoader";
import { SharedPlanRoute } from "./SharedPlanRoute";

vi.mock("../editor/RoomScene", () => ({ RoomScene: () => <div data-testid="room-scene" /> }));

function renderShare(id: string) {
  const router = createMemoryRouter(
    [
      {
        path: "/s/:shareId",
        loader: sharedPlanLoader,
        Component: SharedPlanRoute,
        ErrorBoundary: SharedPlanError,
      },
    ],
    { initialEntries: [`/s/${id}`] },
  );
  render(<RouterProvider router={router} />);
}

describe("SharedPlanRoute", () => {
  it("shows a published plan without an account, read-only", async () => {
    const { room, furniture, materials } = demoProject();
    const id = await shares.publishShare({
      projectId: "p1",
      name: "Sunny living room",
      layout: { room, furniture, materials },
      shareId: null,
    });

    renderShare(id);

    expect(await screen.findByRole("heading", { name: "Sunny living room" })).toBeInTheDocument();
    expect(screen.getByTestId("room-scene")).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "Plan" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Undo" })).not.toBeInTheDocument();
  });

  it("explains when the link no longer works", async () => {
    renderShare("revoked");

    expect(
      await screen.findByRole("heading", { name: "This shared plan is not available" }),
    ).toBeInTheDocument();
  });
});
