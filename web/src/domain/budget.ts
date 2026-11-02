import type { Placement } from "@roomcraft/shared";
import { catalogItem } from "./catalog";

export interface PriceRange {
  min: number;
  max: number;
}

/** What the furniture costs in total, from every piece's lowest to its highest price. */
export function layoutCost(furniture: readonly Placement[]): PriceRange {
  return furniture.reduce<PriceRange>(
    (total, placement) => {
      const item = catalogItem(placement.itemId);
      return item ? { min: total.min + item.price.min, max: total.max + item.price.max } : total;
    },
    { min: 0, max: 0 },
  );
}
