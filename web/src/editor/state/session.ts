import type { StateCreator } from "zustand";
import type { EditorState } from "./editorStore";

export type Lighting = "day" | "night";
export type CameraMode = "orbit" | "plan" | "walk";

/** How big a picture of the view to take, and in which format. */
export interface CaptureOptions {
  width: number;
  height: number;
  type: "image/webp" | "image/jpeg";
  quality: number;
}

export type Capture = (options?: CaptureOptions) => string | null;

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
  /** Renders the current view as an image data URL (a small WebP thumbnail by default). */
  captureThumbnail: Capture | null;
  lighting: Lighting;
  cameraMode: CameraMode;

  setReadOnly: (readOnly: boolean) => void;
  setLighting: (lighting: Lighting) => void;
  setCameraMode: (mode: CameraMode) => void;
  setShareId: (shareId: string | null) => void;
  setSave: (save: SaveStatus) => void;
  setCaptureThumbnail: (capture: Capture | null) => void;
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

    // Switching to viewing only (a phone) also drops the selection and any drag.
    setReadOnly: (readOnly) => {
      set(readOnly ? { readOnly, selectedId: null, drag: null } : { readOnly });
    },
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
