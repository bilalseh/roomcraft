import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, beforeEach, vi } from "vitest";
import { resetFakeBackend } from "./fakeBackend";
import { installMatchMedia, matchMediaQueries } from "./media";

// Tests never talk to Firebase: the data layer is replaced by an in-memory fake.
vi.mock("../data/auth", async () => (await import("./fakeBackend")).auth);
vi.mock("../data/projects", async () => (await import("./fakeBackend")).projects);
vi.mock("../data/versions", async () => (await import("./fakeBackend")).versions);
vi.mock("../data/shares", async () => (await import("./fakeBackend")).shares);
vi.mock("../data/thumbnails", async () => (await import("./fakeBackend")).thumbnails);
vi.mock("../data/assistant", async () => (await import("./fakeBackend")).assistant);

// jsdom has the <dialog> element but none of its methods.
const dialog: Partial<Pick<HTMLDialogElement, "showModal" | "close">> = HTMLDialogElement.prototype;
if (!("showModal" in dialog)) {
  Object.assign(HTMLDialogElement.prototype, {
    showModal(this: HTMLDialogElement) {
      this.open = true;
    },
    close(this: HTMLDialogElement) {
      this.open = false;
      this.dispatchEvent(new Event("close"));
    },
  });
}

installMatchMedia();

beforeEach(() => {
  resetFakeBackend();
  matchMediaQueries(() => false);
  // The onboarding tour has its own test; elsewhere it counts as seen.
  localStorage.setItem("roomcraft:tour-seen", "yes");
});

afterEach(() => {
  cleanup();
});
