import type { Category, OpeningKind, RoomType, Style, Wall } from "@roomcraft/shared";

interface Described {
  label: string;
  description: string;
}

export const ROOM_TYPE_LABELS: Record<RoomType, Described> = {
  living_room: { label: "Living room", description: "Sofa, coffee table, TV and a place to read." },
  bedroom: { label: "Bedroom", description: "Bed, storage and a calm place to wind down." },
  office: { label: "Office", description: "Desk, chair, shelves and good light." },
  studio: { label: "Studio", description: "Living and sleeping in one open space." },
};

export const STYLE_LABELS: Record<Style, Described> = {
  modern: { label: "Modern", description: "Clean lines, neutral tones and one bold accent." },
  scandinavian: { label: "Scandinavian", description: "Light wood, soft whites and muted greens." },
  industrial: { label: "Industrial", description: "Dark wood, concrete greys and rusty reds." },
  classic: { label: "Classic", description: "Warm walnut, cream walls and deep burgundy." },
};

export const WALL_LABELS: Record<Wall, string> = {
  north: "North wall",
  east: "East wall",
  south: "South wall",
  west: "West wall",
};

/** Where an opening's position is measured from, matching the plan coordinates. */
export const WALL_START_CORNERS: Record<Wall, string> = {
  north: "north-west corner",
  east: "north-east corner",
  south: "south-west corner",
  west: "north-west corner",
};

export const OPENING_KIND_LABELS: Record<OpeningKind, string> = { door: "Door", window: "Window" };

export const CATEGORY_LABELS: Record<Category, string> = {
  seating: "Seating",
  tables: "Tables",
  storage: "Storage",
  beds: "Beds",
  lighting: "Lighting",
  decor: "Decor",
};
