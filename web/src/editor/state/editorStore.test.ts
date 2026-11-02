import type { Placement } from "@roomcraft/shared";
import { describe, expect, it } from "vitest";
import { createProject } from "../../domain/project";
import { demoProject } from "../../project/demoProject";
import { createEditorStore } from "./editorStore";

function storeWith(furniture: Placement[]) {
  const { room } = demoProject();
  const project = { ...createProject("p1", "Test", room, new Date()), furniture };
  let next = 0;
  return createEditorStore(project, () => `new-${String(++next)}`);
}

const sofa: Placement = { id: "sofa", itemId: "sofa-three-seat", x: 2.6, z: 2.1, rotation: 0 };
const table: Placement = { id: "table", itemId: "coffee-table", x: 2.6, z: 3.2, rotation: 0 };
const furniture = (store: ReturnType<typeof storeWith>) =>
  store.getState().history.present.furniture;

describe("editor store", () => {
  it("adds an item, selects it, and undoes and redoes the addition", () => {
    const store = storeWith([]);

    store.getState().add("armchair");
    expect(furniture(store).map((placement) => placement.id)).toEqual(["new-1"]);
    expect(store.getState().selectedId).toBe("new-1");

    store.getState().undo();
    expect(furniture(store)).toEqual([]);
    expect(store.getState().selectedId).toBeNull();

    store.getState().redo();
    expect(furniture(store)).toHaveLength(1);
  });

  it("snaps while dragging and records one step when the drag ends", () => {
    const store = storeWith([sofa]);

    store.getState().dragTo("sofa", 2.03, 1.47);
    store.getState().dragTo("sofa", 2.21, 1.04);
    expect(store.getState().drag).toMatchObject({ x: 2.2, z: 1, problem: null });
    expect(store.getState().history.past).toHaveLength(0);

    store.getState().endDrag();
    expect(furniture(store)[0]).toMatchObject({ x: 2.2, z: 1 });
    expect(store.getState().history.past).toHaveLength(1);
  });

  it("puts the item back and explains why when it is dropped on another piece", () => {
    const store = storeWith([sofa, table]);

    store.getState().dragTo("table", 2.6, 2.2);
    expect(store.getState().drag?.problem).toEqual({ code: "overlaps", otherId: "sofa" });

    store.getState().endDrag();
    expect(furniture(store)[1]).toEqual(table);
    expect(store.getState().notice?.text).toBe("It would overlap the three-seat sofa.");
  });

  it("rotates, nudges, duplicates and removes the selected item", () => {
    const store = storeWith([sofa]);
    store.getState().select("sofa");

    store.getState().rotateSelected(1);
    store.getState().nudgeSelected(0.1, 0);
    expect(furniture(store)[0]).toMatchObject({ rotation: 15, x: 2.7 });

    store.getState().duplicateSelected();
    expect(store.getState().selectedId).toBe("new-1");
    expect(furniture(store)).toHaveLength(2);

    store.getState().removeSelected();
    expect(furniture(store)).toHaveLength(1);
    expect(store.getState().selectedId).toBeNull();
  });

  it("keeps wall pieces facing into the room", () => {
    const art: Placement = { id: "art", itemId: "wall-art", x: 2, z: 0.02, rotation: 0 };
    const store = storeWith([art]);
    store.getState().select("art");

    store.getState().rotateSelected(1);

    expect(furniture(store)[0]?.rotation).toBe(0);
    expect(store.getState().notice?.text).toBe("Wall pieces always face into the room.");
  });

  it("changes finishes as undoable steps", () => {
    const store = storeWith([]);
    const before = store.getState().history.present.materials;

    store.getState().setMaterials({ floor: "carpet", floorColor: "#55565a" });
    expect(store.getState().history.present.materials).toMatchObject({ floor: "carpet" });

    store.getState().undo();
    expect(store.getState().history.present.materials).toEqual(before);
  });

  it("recolours the selected piece and restores its catalog colour", () => {
    const store = storeWith([sofa]);
    store.getState().select("sofa");

    store.getState().setSelectedColor("#a3593f");
    expect(furniture(store)[0]?.color).toBe("#a3593f");

    store.getState().setSelectedColor(null);
    expect(furniture(store)[0]).not.toHaveProperty("color");
  });

  it("clears the selection when walking around", () => {
    const store = storeWith([sofa]);
    store.getState().select("sofa");

    store.getState().setCameraMode("walk");

    expect(store.getState().selectedId).toBeNull();
    expect(store.getState().history.past).toHaveLength(0);
  });
});
