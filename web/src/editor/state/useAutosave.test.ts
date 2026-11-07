import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createProject } from "../../domain/project";
import { demoProject } from "../../project/demoProject";
import { GUEST, savedProject, seedProject, signInAs } from "../../test/fakeBackend";
import { createEditorStore } from "./editorStore";
import { useAutosave } from "./useAutosave";

function editorFor(id: string) {
  const project = createProject(id, "Test", demoProject().room, new Date());
  signInAs(GUEST);
  seedProject(project, GUEST.uid);
  return createEditorStore(project, { ownerId: GUEST.uid });
}

describe("autosave", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("says a change is being saved from the moment it is made until it is written", async () => {
    const store = editorFor("p1");
    renderHook(() => {
      useAutosave(store);
    });

    act(() => {
      store.getState().add("armchair");
    });
    expect(store.getState().save.state).toBe("saving");
    expect(savedProject("p1")?.project.furniture).toEqual([]);

    await act(() => vi.advanceTimersByTimeAsync(1000));
    expect(store.getState().save.state).toBe("saved");
    expect(savedProject("p1")?.project.furniture).toHaveLength(1);
  });
});
