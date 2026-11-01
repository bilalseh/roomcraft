import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { usePreferences } from "../app/preferences";
import { createProject } from "../domain/project";
import { demoProject } from "../project/demoProject";
import { loadProject, saveProject } from "../project/localProjects";
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
  return userEvent.setup();
}

const roomTab = () => screen.getByRole("tab", { name: /In this room/ });

describe("EditorRoute", () => {
  beforeEach(() => {
    localStorage.clear();
    usePreferences.setState({ units: "metric" });
  });

  it("opens the furnished demo room", async () => {
    renderEditor("/p/demo");

    expect(await screen.findByRole("heading", { name: /Sunny living room/ })).toBeInTheDocument();
    expect(
      screen.getByText("Living room · 5.2 × 4.2 m · Scandinavian · Budget $4,000"),
    ).toBeInTheDocument();
    expect(screen.getByText("Demo: changes are not saved")).toBeInTheDocument();
    expect(roomTab()).toHaveTextContent("In this room (11)");
  });

  it("adds furniture from the catalog, and undoes and redoes it", async () => {
    const user = renderEditor("/p/demo");
    await screen.findByRole("heading", { name: /Sunny living room/ });

    await user.click(screen.getByRole("button", { name: "Add ottoman" }));
    expect(roomTab()).toHaveTextContent("In this room (12)");
    expect(screen.getByRole("region", { name: "Selected furniture" })).toHaveTextContent("Ottoman");

    await user.click(screen.getByRole("button", { name: "Undo" }));
    expect(roomTab()).toHaveTextContent("In this room (11)");

    await user.keyboard("{Control>}{Shift>}z{/Shift}{/Control}");
    expect(roomTab()).toHaveTextContent("In this room (12)");
  });

  it("selects furniture from the list and removes it with the keyboard", async () => {
    const user = renderEditor("/p/demo");
    await screen.findByRole("heading", { name: /Sunny living room/ });

    await user.click(roomTab());
    await user.click(screen.getByRole("button", { name: "Armchair" }));
    const card = screen.getByRole("region", { name: "Selected furniture" });
    expect(within(card).getByRole("heading", { name: "Armchair" })).toBeInTheDocument();

    await user.keyboard("{Delete}");
    expect(screen.queryByRole("button", { name: "Armchair" })).not.toBeInTheDocument();

    await user.keyboard("{Control>}z{/Control}");
    expect(screen.getByRole("button", { name: "Armchair" })).toBeInTheDocument();
  });

  it("saves changes to a project in this browser", async () => {
    const { room } = demoProject();
    saveProject(createProject("abc", "My office", { ...room, type: "office" }, new Date()));
    const user = renderEditor("/p/abc");
    await screen.findByRole("heading", { name: "My office" });

    await user.click(screen.getByRole("button", { name: "Add desk" }));

    await waitFor(() => {
      expect(loadProject("abc")?.furniture.map((placement) => placement.itemId)).toEqual(["desk"]);
    });
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
