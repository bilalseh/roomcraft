import { render, screen } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { usePreferences } from "../app/preferences";
import { createProject } from "../domain/project";
import { demoProject } from "../project/demoProject";
import { saveProject } from "../project/localProjects";
import { EditorError } from "./EditorError";
import { EditorRoute } from "./EditorRoute";
import { editorLoader } from "./loadProject";

// WebGL is not available in jsdom; the scene itself is checked in the browser.
vi.mock("./RoomScene", () => ({ RoomScene: () => <div data-testid="room-scene" /> }));

function renderEditor(path: string) {
  const router = createMemoryRouter(
    [
      {
        path: "/p/:projectId",
        loader: editorLoader,
        Component: EditorRoute,
        ErrorBoundary: EditorError,
      },
    ],
    { initialEntries: [path] },
  );
  render(<RouterProvider router={router} />);
}

describe("EditorRoute", () => {
  beforeEach(() => {
    localStorage.clear();
    usePreferences.setState({ units: "metric" });
  });

  it("opens the demo room", async () => {
    renderEditor("/p/demo");

    expect(await screen.findByRole("heading", { name: "Sunny living room" })).toBeInTheDocument();
    expect(
      screen.getByText("Living room · 5.2 × 4.2 m · Scandinavian · Budget $4,000"),
    ).toBeInTheDocument();
    expect(screen.getByTestId("room-scene")).toBeInTheDocument();
  });

  it("opens a room saved in this browser", async () => {
    const { room } = demoProject();
    saveProject(createProject("abc", "My office", { ...room, type: "office" }, new Date()));

    renderEditor("/p/abc");

    expect(await screen.findByRole("heading", { name: "My office" })).toBeInTheDocument();
  });

  it("explains when a room cannot be found", async () => {
    renderEditor("/p/missing");

    expect(
      await screen.findByRole("heading", { name: "We couldn't find that room" }),
    ).toBeInTheDocument();
  });

  it("treats unreadable saved data as missing", async () => {
    localStorage.setItem("roomcraft:project:broken", "{not json");

    renderEditor("/p/broken");

    expect(
      await screen.findByRole("heading", { name: "We couldn't find that room" }),
    ).toBeInTheDocument();
  });
});
