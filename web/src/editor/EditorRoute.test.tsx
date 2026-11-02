import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { usePreferences } from "../app/preferences";
import { createProject, type Project } from "../domain/project";
import { demoProject } from "../project/demoProject";
import { ALEX, savedProject, seedProject, signInAs } from "../test/fakeBackend";
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

/** Alex's copy of the furnished demo room. */
function seedDemo(): Project {
  const project = { ...demoProject(), id: "room-1" };
  seedProject(project, ALEX.uid);
  return project;
}

const roomTab = () => screen.getByRole("tab", { name: /In room/ });
const heading = (name: string) => screen.findByRole("heading", { name });

describe("EditorRoute", () => {
  beforeEach(() => {
    usePreferences.setState({ units: "metric" });
    signInAs(ALEX);
  });

  it("opens a furnished room", async () => {
    seedDemo();
    renderEditor("/p/room-1");

    expect(await heading("Sunny living room")).toBeInTheDocument();
    expect(
      screen.getByText("Living room · 5.2 × 4.2 m · Scandinavian · Budget $4,000"),
    ).toBeInTheDocument();
    expect(roomTab()).toHaveTextContent("In room (11)");
  });

  it("adds furniture from the catalog, and undoes and redoes it", async () => {
    seedDemo();
    const user = renderEditor("/p/room-1");
    await heading("Sunny living room");

    await user.click(screen.getByRole("button", { name: "Add ottoman" }));
    expect(roomTab()).toHaveTextContent("In room (12)");
    expect(screen.getByRole("region", { name: "Selected furniture" })).toHaveTextContent("Ottoman");

    await user.click(screen.getByRole("button", { name: "Undo" }));
    expect(roomTab()).toHaveTextContent("In room (11)");

    await user.keyboard("{Control>}{Shift>}z{/Shift}{/Control}");
    expect(roomTab()).toHaveTextContent("In room (12)");
  });

  it("selects furniture from the list and removes it with the keyboard", async () => {
    seedDemo();
    const user = renderEditor("/p/room-1");
    await heading("Sunny living room");

    await user.click(roomTab());
    await user.click(screen.getByRole("button", { name: "Armchair" }));
    const card = screen.getByRole("region", { name: "Selected furniture" });
    expect(within(card).getByRole("heading", { name: "Armchair" })).toBeInTheDocument();

    await user.keyboard("{Delete}");
    expect(screen.queryByRole("button", { name: "Armchair" })).not.toBeInTheDocument();

    await user.keyboard("{Control>}z{/Control}");
    expect(screen.getByRole("button", { name: "Armchair" })).toBeInTheDocument();
  });

  it("saves changes and says when it last saved", async () => {
    const room = { ...demoProject().room, type: "office" as const };
    seedProject(createProject("office", "My office", room, new Date()), ALEX.uid);
    const user = renderEditor("/p/office");
    await heading("My office");

    await user.click(screen.getByRole("button", { name: "Add desk" }));

    await waitFor(() => {
      const furniture = savedProject("office")?.project.furniture ?? [];
      expect(furniture.map((placement) => placement.itemId)).toEqual(["desk"]);
    });
    expect(screen.getByText("Saved just now")).toBeInTheDocument();
  });

  it("changes the floor in the Finishes tab, as an undoable step", async () => {
    seedDemo();
    const user = renderEditor("/p/room-1");
    await heading("Sunny living room");

    await user.click(screen.getByRole("tab", { name: "Finishes" }));
    await user.click(screen.getByRole("radio", { name: "Carpet" }));
    expect(screen.getByRole("radio", { name: "Oatmeal" })).toBeChecked();

    await user.click(screen.getByRole("button", { name: "Undo" }));
    expect(screen.getByRole("radio", { name: "Wood" })).toBeChecked();
  });

  it("warns about a blocked door and selects the piece in the way", async () => {
    const project = createProject("blocked", "Blocked door", demoProject().room, new Date());
    // The demo door is on the south wall, 0.6 m from the corner; this chair stands in its swing.
    const chair = { id: "chair", itemId: "armchair", x: 1.2, z: 3.6, rotation: 0 };
    seedProject({ ...project, furniture: [chair] }, ALEX.uid);
    const user = renderEditor("/p/blocked");
    await heading("Blocked door");

    await user.click(screen.getByRole("button", { name: "1 layout warning" }));
    await user.click(
      screen.getByRole("button", { name: "The armchair stops a door from opening fully." }),
    );

    expect(screen.getByRole("region", { name: "Selected furniture" })).toHaveTextContent(
      "Armchair",
    );
  });

  it("saves a version and restores it as an undoable step", async () => {
    seedDemo();
    const user = renderEditor("/p/room-1");
    await heading("Sunny living room");

    await user.click(screen.getByRole("button", { name: "Versions" }));
    await user.type(screen.getByRole("textbox", { name: "Version name" }), "Before the move");
    await user.click(screen.getByRole("button", { name: "Save version" }));
    expect(await screen.findByText("Before the move")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Close" }));

    await user.click(screen.getByRole("button", { name: "Add ottoman" }));
    expect(roomTab()).toHaveTextContent("In room (12)");
    await user.click(screen.getByRole("button", { name: "Versions" }));
    await user.click(await screen.findByRole("button", { name: "Restore Before the move" }));

    expect(roomTab()).toHaveTextContent("In room (11)");
    await user.click(screen.getByRole("button", { name: "Undo" }));
    expect(roomTab()).toHaveTextContent("In room (12)");
  });

  it("publishes a share link and stops sharing", async () => {
    seedDemo();
    const user = renderEditor("/p/room-1");
    await heading("Sunny living room");

    await user.click(screen.getByRole("button", { name: "Share" }));
    await user.click(screen.getByRole("button", { name: "Create a share link" }));

    const link = await screen.findByRole("textbox", { name: "Share link" });
    expect(link).toHaveValue(`${window.location.origin}/s/share-1`);
    expect(savedProject("room-1")?.shareId).toBe("share-1");

    await user.click(screen.getByRole("button", { name: "Stop sharing" }));
    expect(await screen.findByRole("button", { name: "Create a share link" })).toBeInTheDocument();
  });

  it("asks people who are signed out to sign in", async () => {
    seedDemo();
    signInAs(null);

    renderEditor("/p/room-1");

    expect(await heading("Sign in to open this room")).toBeInTheDocument();
  });

  it("treats someone else's room as missing", async () => {
    seedProject({ ...demoProject(), id: "theirs" }, "someone-else");

    renderEditor("/p/theirs");

    expect(await heading("We couldn't find that room")).toBeInTheDocument();
  });
});
