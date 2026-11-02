import type { StateCreator } from "zustand";
import type { EditorState } from "./editorStore";

export type Lighting = "day" | "night";
export type CameraMode = "orbit" | "plan" | "walk";

export interface SaveStatus {
  state: "saved" | "saving" | "error";
  /** When the last save finished, in milliseconds since the epoch. */
  savedAt: number | null;
}

/** How the room is being looked at and kept, as opposed to what is in it. */
export interface SessionSlice {
  /** A shared plan: viewing only, nothing can be selected or changed. */
  readOnly: boolean;
  ownerId: string | null;
  shareId: string | null;
  save: SaveStatus;
  /** Renders the current view as a small WebP data URL, while the scene is mounted. */
  captureThumbnail: (() => string | null) | null;
  lighting: Lighting;
  cameraMode: CameraMode;

  setLighting: (lighting: Lighting) => void;
  setCameraMode: (mode: CameraMode) => void;
  setShareId: (shareId: string | null) => void;
  setSave: (save: SaveStatus) => void;
  setCaptureThumbnail: (capture: (() => string | null) | null) => void;
}

export interface SessionOptions {
  readOnly?: boolean;
  ownerId?: string | null;
  shareId?: string | null;
}

export function sessionSlice(
  options: SessionOptions,
): StateCreator<EditorState, [], [], SessionSlice> {
  return (set) => ({
    readOnly: options.readOnly ?? false,
    ownerId: options.ownerId ?? null,
    shareId: options.shareId ?? null,
    save: { state: "saved", savedAt: null },
    captureThumbnail: null,
    lighting: "day",
    cameraMode: "orbit",

    setLighting: (lighting) => {
      set({ lighting });
    },
    // Walking around is for looking, not editing, so it clears the selection.
    setCameraMode: (cameraMode) => {
      set(cameraMode === "walk" ? { cameraMode, selectedId: null, drag: null } : { cameraMode });
    },
    setShareId: (shareId) => {
      set({ shareId });
    },
    setSave: (save) => {
      set({ save });
    },
    setCaptureThumbnail: (captureThumbnail) => {
      set({ captureThumbnail });
    },
  });
}
