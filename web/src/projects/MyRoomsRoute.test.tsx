import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router";
import { describe, expect, it } from "vitest";
import { demoProject } from "../project/demoProject";
import { ALEX, GUEST, savedProject, seedProject, signInAs } from "../test/fakeBackend";
import { myRoomsLoader } from "./myRoomsLoader";
import { MyRoomsRoute } from "./MyRoomsRoute";

function renderMyRooms() {
  const router = createMemoryRouter(
    [{ path: "/projects", loader: myRoomsLoader, Component: MyRoomsRoute }],
    { initialEntries: ["/projects"] },
  );
  render(<RouterProvider router={router} />);
  return userEvent.setup();
}

describe("MyRoomsRoute", () => {
  it("lists only the signed-in person's rooms", async () => {
    signInAs(ALEX);
    seedProject({ ...demoProject(), id: "mine", name: "My lounge" }, ALEX.uid);
    seedProject({ ...demoProject(), id: "theirs", name: "Their lounge" }, "someone-else");

    renderMyRooms();

    expect(await screen.findByRole("link", { name: /My lounge/ })).toHaveAttribute(
      "href",
      "/p/mine",
    );
    expect(screen.queryByText("Their lounge")).not.toBeInTheDocument();
  });

  it("invites guests to keep their rooms with Google", async () => {
    signInAs(GUEST);

    renderMyRooms();

    expect(await screen.findByText(/You are using a guest account/)).toBeInTheDocument();
    expect(screen.getByText("No rooms yet.")).toBeInTheDocument();
  });

  it("deletes a room after asking", async () => {
    signInAs(ALEX);
    seedProject({ ...demoProject(), id: "mine", name: "My lounge" }, ALEX.uid);
    const user = renderMyRooms();

    await user.click(await screen.findByRole("button", { name: "Delete My lounge" }));
    await user.click(screen.getByRole("button", { name: "Delete room" }));

    expect(await screen.findByText("No rooms yet.")).toBeInTheDocument();
    expect(savedProject("mine")).toBeUndefined();
  });

  it("asks people who are signed out to sign in", async () => {
    renderMyRooms();

    expect(
      await screen.findByText("Sign in to see the rooms you have planned."),
    ).toBeInTheDocument();
  });
});
