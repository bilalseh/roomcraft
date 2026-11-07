import type { ModelKind } from "@roomcraft/shared";
import type { ComponentType } from "react";
import type { ModelProps } from "../parts";
import { Bed } from "./beds";
import { Mirror, RoundRug, Rug, WallArt } from "./decor";
import { FloorLamp, Pendant } from "./lighting";
import { PottedPlant } from "./PottedPlant";
import { Chair, OfficeChair, Ottoman, Sofa } from "./seating";
import { Bookshelf, Cabinet, MediaUnit, WallShelf, Wardrobe } from "./storage";
import { Desk, Table } from "./tables";

/** The builder for each catalog model kind: procedural, except the scanned plant. */
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
  plant: PottedPlant,
  wall_art: WallArt,
  mirror: Mirror,
  wall_shelf: WallShelf,
};
