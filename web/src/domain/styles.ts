import type { Style } from "@roomcraft/shared";

export interface Palette {
  wall: string;
  floor: string;
  trim: string;
  accent: string;
}

/** Default finishes for each style; the editor's material controls start from these. */
export const STYLE_PALETTES: Record<Style, Palette> = {
  modern: { wall: "#f3f2ef", floor: "#c9c1b6", trim: "#2f2f2f", accent: "#0f766e" },
  scandinavian: { wall: "#f7f4ee", floor: "#e0cba8", trim: "#ffffff", accent: "#8fa58a" },
  industrial: { wall: "#bdb7ae", floor: "#6f5240", trim: "#3a3633", accent: "#b2532f" },
  classic: { wall: "#efe5d3", floor: "#8b5d3d", trim: "#f8f3ea", accent: "#7a2e3a" },
};
