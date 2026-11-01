import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { routes } from "./routes";

function renderAt(path: string) {
  const router = createMemoryRouter(routes, { initialEntries: [path] });
  render(<RouterProvider router={router} />);
  return router;
}

describe("routes", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => Promise.resolve(Response.json({ status: "ok", version: "0.1.0" }))),
    );
  });

  it("renders the landing page with the API status in the footer", async () => {
    renderAt("/");

    expect(
      screen.getByRole("heading", { level: 1, name: /plan your room in 3d/i }),
    ).toBeInTheDocument();
    expect(await screen.findByText("API online · v0.1.0")).toBeInTheDocument();
  });

  it("opens the setup wizard from the landing page", async () => {
    const router = renderAt("/");

    await userEvent.click(screen.getByRole("link", { name: "Start a new room" }));

    expect(router.state.location.pathname).toBe("/new");
    expect(screen.getByRole("heading", { level: 1, name: "Set up your room" })).toBeInTheDocument();
  });

  it("renders the shared plan page", () => {
    renderAt("/s/abc123");

    expect(screen.getByRole("heading", { level: 1, name: "Shared plan" })).toBeInTheDocument();
  });

  it("renders the not-found page for unknown paths", () => {
    renderAt("/no-such-page");

    expect(screen.getByRole("heading", { level: 1, name: "Page not found" })).toBeInTheDocument();
  });
});
