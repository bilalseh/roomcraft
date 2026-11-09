import type { ModelKind } from "@roomcraft/shared";
import type { ComponentType } from "react";
import type { ModelProps } from "../parts";
import { Bed } from "./beds";
import { Mirror, Plant, RoundRug, Rug, WallArt } from "./decor";
import { FloorLamp, Pendant } from "./lighting";
import { Chair, OfficeChair, Ottoman, Sofa } from "./seating";
import { Bookshelf, Cabinet, MediaUnit, WallShelf, Wardrobe } from "./storage";
import { Desk, Table } from "./tables";

/**
 * The simple shapes for each catalog model kind: all a piece is made of, unless it
 * has a model file (see ../scans.ts), which they stand in for while it loads.
 */
export const MODELS: Record<ModelKind, ComponentType<ModelProps>> = {
  sofa: Sofa,
  armchair: Sofa,
  chair: Chair,
  office_chair: OfficeChair,
  ottoman: Ottoman,
  table: Table,
  desk: Desk,
  bed: Bed,
  cabinet: Cabinet,
  wardrobe: Wardrobe,
  bookshelf: Bookshelf,
  media_unit: MediaUnit,
  floor_lamp: FloorLamp,
  pendant: Pendant,
  rug: Rug,
  round_rug: RoundRug,
  plant: Plant,
  wall_art: WallArt,
  mirror: Mirror,
  wall_shelf: WallShelf,
};
