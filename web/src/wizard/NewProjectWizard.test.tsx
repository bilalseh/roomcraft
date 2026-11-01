import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider, useParams } from "react-router";
import { beforeEach, describe, expect, it } from "vitest";
import { usePreferences } from "../app/preferences";
import { loadProject } from "../project/localProjects";
import { NewProjectWizard } from "./NewProjectWizard";

function EditorStub() {
  return <p>Editor for {useParams().projectId}</p>;
}

function renderWizard() {
  const router = createMemoryRouter(
    [
      { path: "/new", Component: NewProjectWizard },
      { path: "/p/:projectId", Component: EditorStub },
    ],
    { initialEntries: ["/new"] },
  );
  render(<RouterProvider router={router} />);
  return { router, user: userEvent.setup() };
}

const heading = () => screen.getByRole("heading", { level: 1 });
const next = () => screen.getByRole("button", { name: "Next" });

async function replace(user: ReturnType<typeof userEvent.setup>, field: HTMLElement, text: string) {
  await user.clear(field);
  await user.type(field, text);
}

describe("NewProjectWizard", () => {
  beforeEach(() => {
    localStorage.clear();
    usePreferences.setState({ units: "metric" });
  });

  it("asks for a room type before moving on", async () => {
    const { user } = renderWizard();

    await user.click(next());

    expect(screen.getByText("Choose the kind of room.")).toBeInTheDocument();
    expect(heading()).toHaveTextContent("What kind of room are you planning?");
  });

  it("creates the room from every answer and opens it in the editor", async () => {
    const { router, user } = renderWizard();

    await user.click(screen.getByRole("radio", { name: /Bedroom/ }));
    await user.click(next());
    expect(heading()).toHaveTextContent("How big is the room?");
    await replace(user, screen.getByRole("textbox", { name: "Width (west to east)" }), "5");
    await user.click(next());
    expect(heading()).toHaveTextContent("Where are the doors and windows?");
    await user.click(next());
    await user.click(screen.getByRole("radio", { name: /Scandinavian/ }));
    await user.click(next());
    await replace(user, screen.getByRole("textbox", { name: "Furniture budget (USD)" }), "2500");
    await user.click(next());

    expect(heading()).toHaveTextContent("Ready to build your room?");
    expect(screen.getByRole("textbox", { name: "Room name" })).toHaveValue("Bedroom");
    await user.click(screen.getByRole("button", { name: "Create room" }));

    const id = router.state.location.pathname.replace("/p/", "");
    expect(screen.getByText(`Editor for ${id}`)).toBeInTheDocument();
    expect(loadProject(id)).toMatchObject({
      name: "Bedroom",
      room: { type: "bedroom", width: 5, depth: 3.6, style: "scandinavian", budget: 2500 },
    });
  });

  it("keeps answers when going back", async () => {
    const { user } = renderWizard();
    await user.click(screen.getByRole("radio", { name: /Office/ }));
    await user.click(next());
    await replace(user, screen.getByRole("textbox", { name: "Width (west to east)" }), "6.2");
    await user.click(next());

    await user.click(screen.getByRole("button", { name: "Back" }));
    await user.click(screen.getByRole("button", { name: "Back" }));

    expect(screen.getByRole("radio", { name: /Office/ })).toBeChecked();
    await user.click(next());
    expect(screen.getByRole("textbox", { name: "Width (west to east)" })).toHaveValue("6.2");
  });

  it("flags a window that does not fit on its wall and stays on the step", async () => {
    const { user } = renderWizard();
    await user.click(screen.getByRole("radio", { name: /Studio/ }));
    await user.click(next());
    await user.click(next());

    const window = screen.getByRole("region", { name: "Window 1" });
    await replace(
      user,
      within(window).getByRole("textbox", { name: "From the north-west corner" }),
      "4",
    );

    expect(
      await within(window).findByText("Doesn't fit: the north wall is 4.5 m long."),
    ).toBeInTheDocument();
    await user.click(next());
    expect(heading()).toHaveTextContent("Where are the doors and windows?");
  });

  it("needs at least one door", async () => {
    const { user } = renderWizard();
    await user.click(screen.getByRole("radio", { name: /Studio/ }));
    await user.click(next());
    await user.click(next());

    await user.click(screen.getByRole("button", { name: "Remove door 1" }));
    await user.click(next());

    expect(screen.getByText("Add at least one door.")).toBeInTheDocument();
  });

  it("switches between metric and imperial without changing the room", async () => {
    const { user } = renderWizard();
    await user.click(screen.getByRole("radio", { name: /Bedroom/ }));
    await user.click(next());

    await user.click(screen.getByRole("radio", { name: "Imperial" }));
    expect(screen.getByRole("textbox", { name: "Width (west to east), feet" })).toHaveValue("14");
    expect(screen.getByRole("textbox", { name: "Width (west to east), inches" })).toHaveValue("9");

    await user.click(screen.getByRole("radio", { name: "Metric" }));
    expect(screen.getByRole("textbox", { name: "Width (west to east)" })).toHaveValue("4.5");
  });
});
