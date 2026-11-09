import type { ComponentType } from "react";
import { MEDIA_CABINET, Television } from "./models/storage";
import type { ModelProps } from "./parts";

/** A colour map prepared grey by scripts/prepare-models.mjs, for the piece's colour to tint. */
export const GREY_MAP = "grey";

/** A scanned or modelled piece (Poly Haven, CC0) in web/public/models. */
export interface Scan {
  file: string;
  /**
   * Materials that take the piece's colour, by name: grey maps, or a map already
   * showing the given colour, which is shifted from there (the plant's leaves).
   */
  tint: Readonly<Record<string, string>>;
  /** Quarter turns that make the model face +z with its width along x. */
  turns?: number;
  /**
   * How it fills the catalog box: stretched to it (the default), at its own size
   * (decor on furniture), or scaled evenly and allowed to spread past the footprint.
   */
  fit?: "stretch" | "natural" | { spread: number };
  /** The height it fills, when it is only the lower part of the piece. */
  height?: number;
  /** Parts drawn with it, such as the television on the media unit. */
  extra?: ComponentType<ModelProps>;
}

/** Catalog items with a model; the others are built from simple shapes (see models/). */
export const SCANS: Readonly<Partial<Record<string, Scan>>> = {
  armchair: { file: "armchair.glb", tint: { modern_arm_chair_01_pillow: GREY_MAP } },
  ottoman: { file: "ottoman.glb", tint: { Ottoman_01: GREY_MAP } },
  "dining-chair": { file: "dining-chair.glb", tint: { dining_chair_02: GREY_MAP } },
  "coffee-table": {
    file: "coffee-table.glb",
    tint: { modern_coffee_table_01: GREY_MAP },
    turns: 1,
  },
  "side-table": { file: "side-table.glb", tint: { side_table_01: GREY_MAP } },
  "dining-table": { file: "dining-table.glb", tint: { wooden_table_02: GREY_MAP } },
  bookshelf: { file: "bookshelf.glb", tint: { steel_frame_shelves_01: GREY_MAP } },
  "media-unit": {
    file: "media-unit.glb",
    tint: { modern_wooden_cabinet: GREY_MAP },
    height: MEDIA_CABINET,
    extra: Television,
  },
  "wall-art": { file: "wall-art.glb", tint: { hanging_picture_frame_02_artwork: GREY_MAP } },
  "plant-tall": {
    file: "plant-tall.glb",
    tint: { potted_plant_01_leaves: "#4d7c4f" },
    fit: { spread: 1.3 },
  },
};

/**
 * The commit of this repository whose web/public/models jsDelivr serves to the live
 * site, which keeps them off Firebase Hosting's daily download allowance. A changed
 * model needs a new commit here (see web/public/models/README.md).
 */
const MODELS_COMMIT = "eb124c3b000c77018b023f8a0ebb1fa5843ed528";

export function modelUrl(file: string): string {
  return import.meta.env.MODE === "production"
    ? `https://cdn.jsdelivr.net/gh/bilalseh/roomcraft@${MODELS_COMMIT}/web/public/models/${file}`
    : `${import.meta.env.BASE_URL}models/${file}`;
}
