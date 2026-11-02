import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { usePreferences } from "../../app/preferences";
import { demoProject } from "../../project/demoProject";
import { ALEX, seedProject, signInAs } from "../../test/fakeBackend";
import { EditorRoute } from "../EditorRoute";
import { editorLoader } from "../loadProject";

vi.mock("../RoomScene", () => ({ RoomScene: () => <div data-testid="room-scene" /> }));

const { download } = vi.hoisted(() => ({ download: vi.fn<(file: Blob, name: string) => void>() }));
vi.mock("../../lib/download", () => ({ download, slug: () => "sunny-living-room" }));

function renderEditor() {
  const router = createMemoryRouter(
    [{ path: "/p/:projectId", loader: editorLoader, Component: EditorRoute }],
    { initialEntries: ["/p/room-1"] },
  );
  render(<RouterProvider router={router} />);
  return userEvent.setup();
}

describe("budget and shopping list", () => {
  beforeEach(() => {
    usePreferences.setState({ units: "metric" });
    signInAs(ALEX);
    seedProject({ ...demoProject(), id: "room-1" }, ALEX.uid);
  });

  it("measures the furniture's price range against the budget", async () => {
    renderEditor();

    const meter = await screen.findByRole("meter", { name: "Furniture cost against the budget" });
    expect(meter).toHaveAttribute(
      "aria-valuetext",
      "$2,079 – $5,099 of a $4,000 budget. Depends on the prices you pay.",
    );
  });

  it("lists the furniture by category and downloads it as CSV", async () => {
    const user = renderEditor();
    await screen.findByRole("meter");

    await user.click(screen.getByRole("button", { name: "Shopping list" }));
    const table = screen.getByRole("table", { name: "Furniture to buy, with price ranges" });
    expect(within(table).getByRole("rowheader", { name: "Seating" })).toBeInTheDocument();
    expect(within(table).getByText("Three-seat sofa")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Download CSV" }));
    const [file, name] = download.mock.calls[0] ?? [];
    expect(name).toBe("sunny-living-room-shopping-list.csv");
    const csv = await file?.text();
    expect(csv).toContain("Seating,Three-seat sofa,1,699,1299,699,1299");
    expect(csv).toContain("Total,,,,,2079,5099");
  });
});
