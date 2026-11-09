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

/** A path-traced picture of the view: being rendered, finished, or not possible here. */
export type Photo =
  | { status: "rendering"; progress: number }
  | { status: "done"; image: string }
  | { status: "failed" };

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
  /** Walking from a corner (0 to 3, see cornerViewpoints), or from the door when null. */
  corner: number | null;
  photo: Photo | null;

  setReadOnly: (readOnly: boolean) => void;
  setLighting: (lighting: Lighting) => void;
  setCameraMode: (mode: CameraMode) => void;
  /** Walk mode from the next corner, at eye height and facing the room. */
  nextCorner: () => void;
  setShareId: (shareId: string | null) => void;
  setSave: (save: SaveStatus) => void;
  setCaptureThumbnail: (capture: Capture | null) => void;
  startPhoto: () => void;
  setPhotoProgress: (progress: number) => void;
  /** The finished image as a data URL, or null when it could not be made. */
  finishPhoto: (image: string | null) => void;
  closePhoto: () => void;
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
    corner: null,
    photo: null,

    // Switching to viewing only (a phone) also drops the selection and any drag.
    setReadOnly: (readOnly) => {
      set(readOnly ? { readOnly, selectedId: null, drag: null } : { readOnly });
    },
    setLighting: (lighting) => {
      set({ lighting });
    },
    // Walking around is for looking, not editing, so it clears the selection.
    setCameraMode: (cameraMode) => {
      set(
        cameraMode === "walk"
          ? { cameraMode, corner: null, selectedId: null, drag: null }
          : { cameraMode, corner: null },
      );
    },
    nextCorner: () => {
      set(({ corner }) => ({
        cameraMode: "walk",
        corner: ((corner ?? -1) + 1) % 4,
        selectedId: null,
        drag: null,
      }));
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
    // A photo shows the room, not the editor: no selection outline or snapping grid.
    startPhoto: () => {
      set({ photo: { status: "rendering", progress: 0 }, selectedId: null, drag: null });
    },
    setPhotoProgress: (progress) => {
      set(({ photo }) => (photo?.status === "rendering" ? { photo: { ...photo, progress } } : {}));
    },
    finishPhoto: (image) => {
      set({ photo: image ? { status: "done", image } : { status: "failed" } });
    },
    closePhoto: () => {
      set({ photo: null });
    },
  });
}
