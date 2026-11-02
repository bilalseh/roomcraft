import { describe, expect, it, vi } from "vitest";
import { demoProject } from "../project/demoProject";
import { askAssistant } from "./assistant";

vi.unmock("./assistant");
vi.mock("./auth", () => ({ idToken: () => Promise.resolve("token") }));

function ask() {
  const { room, furniture, materials } = demoProject();
  return askAssistant({ prompt: "More seats", room, furniture, materials, options: 1 });
}

describe("askAssistant", () => {
  it("says when the assistant took too long", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => Promise.reject(new DOMException("Timed out", "TimeoutError"))),
    );

    await expect(ask()).rejects.toThrow("The assistant took too long to answer.");
  });

  it("says when the assistant could not be reached", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => Promise.reject(new TypeError("Failed to fetch"))),
    );

    await expect(ask()).rejects.toThrow("The assistant could not be reached.");
  });
});
