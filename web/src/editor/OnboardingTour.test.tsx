import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { OnboardingTour } from "./OnboardingTour";

function renderTour() {
  render(
    <>
      <div data-tour="catalog">Catalog</div>
      <div data-tour="scene">Scene</div>
      <button type="button" data-tour="assistant">
        Assistant
      </button>
      <div data-tour="budget">Budget</div>
      <OnboardingTour />
    </>,
  );
  return userEvent.setup();
}

describe("OnboardingTour", () => {
  beforeEach(() => {
    localStorage.removeItem("roomcraft:tour-seen");
  });

  it("walks through the editor, pointing at each control", async () => {
    const user = renderTour();

    expect(screen.getByRole("dialog", { name: "Add furniture" })).toHaveFocus();
    expect(screen.getByText("Catalog")).toHaveAttribute("data-tour-active", "true");

    await user.click(screen.getByRole("button", { name: "Next" }));
    expect(screen.getByRole("dialog", { name: "Arrange the room" })).toBeInTheDocument();
    expect(screen.getByText("Catalog")).not.toHaveAttribute("data-tour-active");
    expect(screen.getByText("Scene")).toHaveAttribute("data-tour-active", "true");

    await user.click(screen.getByRole("button", { name: "Back" }));
    expect(screen.getByRole("dialog", { name: "Add furniture" })).toBeInTheDocument();
  });

  it("is shown once: finishing or skipping it remembers that", async () => {
    const user = renderTour();

    await user.keyboard("{Escape}");

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(localStorage.getItem("roomcraft:tour-seen")).toBe("yes");
  });

  it("does not come back once seen", () => {
    localStorage.setItem("roomcraft:tour-seen", "yes");

    renderTour();

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
