import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { usePreferences } from "../../app/preferences";
import { demoProject } from "../../project/demoProject";
import {
  ALEX,
  assistantRequests,
  seedProject,
  setAssistantReply,
  signInAs,
} from "../../test/fakeBackend";
import { EditorRoute } from "../EditorRoute";
import { editorLoader } from "../loadProject";

vi.mock("../RoomScene", () => ({ RoomScene: () => <div data-testid="room-scene" /> }));

const armchair = {
  op: "add" as const,
  placementId: "ai-1",
  itemId: "armchair",
  x: 1.0,
  z: 1.5,
  rotation: 90,
  reason: "A cosy seat by the window.",
};

function renderEditor() {
  const router = createMemoryRouter(
    [{ path: "/p/:projectId", loader: editorLoader, Component: EditorRoute }],
    { initialEntries: ["/p/room-1"] },
  );
  render(<RouterProvider router={router} />);
  return userEvent.setup();
}

async function openAssistant(user: ReturnType<typeof userEvent.setup>) {
  await screen.findByRole("heading", { name: "Sunny living room" });
  await user.click(screen.getByRole("button", { name: "Assistant" }));
}

const roomTab = () => screen.getByRole("tab", { name: /In room/ });

describe("AssistantPanel", () => {
  beforeEach(() => {
    usePreferences.setState({ units: "metric" });
    signInAs(ALEX);
    seedProject({ ...demoProject(), id: "room-1" }, ALEX.uid);
  });

  it("previews a suggestion, then applies it as one undoable step", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => Promise.resolve(Response.json({ status: "ok", version: "1" }))),
    );
    setAssistantReply({
      suggestions: [{ summary: "A reading nook.", operations: [armchair], rejected: [] }],
      remainingToday: 19,
    });
    const user = renderEditor();
    await openAssistant(user);

    await user.click(
      await screen.findByRole("button", { name: "“Add a reading corner under $400”" }),
    );
    expect(await screen.findByText("Add an armchair")).toBeInTheDocument();
    expect(screen.getByText("19 requests left today")).toBeInTheDocument();
    expect(assistantRequests()[0]).toMatchObject({
      prompt: "Add a reading corner under $400",
      options: 1,
    });

    await user.click(screen.getByRole("button", { name: "Preview in 3D" }));
    expect(roomTab()).toHaveTextContent("In room (11)");
    await user.click(screen.getByRole("button", { name: "Apply" }));
    expect(roomTab()).toHaveTextContent("In room (12)");

    await user.click(screen.getByRole("button", { name: "Undo" }));
    expect(roomTab()).toHaveTextContent("In room (11)");
  });

  it("explains changes the server left out", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => Promise.resolve(Response.json({ status: "ok", version: "1" }))),
    );
    setAssistantReply({
      suggestions: [
        {
          summary: "More seating.",
          operations: [],
          rejected: [
            {
              op: "add",
              reason: "More seats.",
              code: "blocks_door",
              otherId: null,
              openingId: "door",
            },
          ],
        },
      ],
      remainingToday: 18,
    });
    const user = renderEditor();
    await openAssistant(user);

    await user.type(
      await screen.findByRole("textbox", { name: "Ask the assistant" }),
      "More seats{Enter}",
    );

    await user.click(await screen.findByText("1 idea was left out"));
    expect(screen.getByText("It would stop a door from opening.")).toBeInTheDocument();
  });

  it("waits for the sleeping server before taking requests", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => Promise.reject(new TypeError("Failed to fetch"))),
    );
    const user = renderEditor();
    await openAssistant(user);

    expect(await screen.findByText(/Waking up the assistant/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Ask" })).toBeDisabled();
  });
});
