import { describe, expect, it } from "vitest";
import { catalogItem } from "../../domain/catalog";
import { DRESSING } from "./dressing";
import { SCANS } from "./scans";

// The model files, as Vite finds them.
const files = new Set(
  Object.keys(import.meta.glob("/public/models/*.glb")).map((path) => path.split("/").pop()),
);

describe("models and decor", () => {
  it("names real catalog items and files that exist", () => {
    for (const [id, scan] of Object.entries(SCANS)) {
      expect(catalogItem(id), id).toBeDefined();
      expect(files.has(scan?.file), scan?.file).toBe(true);
    }
    for (const [id, place] of Object.entries(DRESSING)) {
      const item = catalogItem(id);
      expect(item, id).toBeDefined();
      for (const prop of place?.({ width: 1, depth: 1, height: 1 }) ?? []) {
        expect(files.has(`${prop.name}.glb`), prop.name).toBe(true);
      }
    }
  });

  it("stands decor on its piece: inside the footprint, no higher than its top", () => {
    for (const [id, place] of Object.entries(DRESSING)) {
      const item = catalogItem(id);
      if (!item || !place) continue;
      for (const { name, at } of place(item)) {
        const [x, y, z] = at;
        expect(Math.abs(x), `${id}: ${name}`).toBeLessThan(item.width / 2);
        expect(Math.abs(z), `${id}: ${name}`).toBeLessThan(item.depth / 2);
        expect(y, `${id}: ${name}`).toBeLessThanOrEqual(item.height + 1e-9);
      }
    }
  });
});
