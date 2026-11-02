import type { FloorMaterial, Materials, Style } from "@roomcraft/shared";
import { STYLE_PALETTES } from "./styles";

export const FLOOR_MATERIALS = [
  "wood",
  "tile",
  "carpet",
] as const satisfies readonly FloorMaterial[];

export interface Swatch {
  name: string;
  color: string;
}

/** Floor colours that suit each material. */
export const FLOOR_SWATCHES: Record<FloorMaterial, Swatch[]> = {
  wood: [
    { name: "Pale oak", color: "#e0cba8" },
    { name: "Natural oak", color: "#c9a77c" },
    { name: "Grey oak", color: "#b9b1a6" },
    { name: "Teak", color: "#9c6b45" },
    { name: "Walnut", color: "#6f5240" },
    { name: "Ebony", color: "#3f3430" },
  ],
  tile: [
    { name: "White", color: "#f1efea" },
    { name: "Sand", color: "#d8cbb5" },
    { name: "Concrete", color: "#a8a49d" },
    { name: "Slate", color: "#5f6467" },
    { name: "Terracotta", color: "#b8714d" },
    { name: "Sage", color: "#a3b19b" },
  ],
  carpet: [
    { name: "Oatmeal", color: "#d8cdbb" },
    { name: "Dove grey", color: "#b4b2ad" },
    { name: "Charcoal", color: "#55565a" },
    { name: "Navy", color: "#3a4a63" },
    { name: "Moss", color: "#6f7d5c" },
    { name: "Rust", color: "#9a5a3f" },
  ],
};

export const WALL_SWATCHES: Swatch[] = [
  { name: "Chalk white", color: "#f7f4ee" },
  { name: "Warm white", color: "#f3f2ef" },
  { name: "Linen", color: "#efe5d3" },
  { name: "Greige", color: "#d9d2c5" },
  { name: "Concrete", color: "#bdb7ae" },
  { name: "Sage", color: "#c9d1bf" },
  { name: "Powder blue", color: "#c8d6de" },
  { name: "Blush", color: "#e8cfc6" },
  { name: "Ochre", color: "#d9b26f" },
  { name: "Deep green", color: "#4f6152" },
];

/** Upholstery and finish colours for furniture. */
export const FINISH_SWATCHES: Swatch[] = [
  { name: "Stone", color: "#b8a48a" },
  { name: "Slate blue", color: "#7c8a99" },
  { name: "Terracotta", color: "#a3593f" },
  { name: "Sage", color: "#8fa58a" },
  { name: "Mustard", color: "#c9a13f" },
  { name: "Charcoal", color: "#3f3f46" },
  { name: "Cream", color: "#ece7df" },
  { name: "Navy", color: "#2f4858" },
  { name: "Oak", color: "#a07d58" },
  { name: "Walnut", color: "#6f5240" },
];

/** The finishes a room starts with: a wooden floor and walls from its style. */
export function defaultMaterials(style: Style): Materials {
  const palette = STYLE_PALETTES[style];
  return { floor: "wood", floorColor: palette.floor, wallColor: palette.wall };
}
