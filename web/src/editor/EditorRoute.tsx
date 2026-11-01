import { RoomScene } from "./RoomScene";

export function EditorRoute() {
  return (
    <div className="relative flex-1 bg-stone-200">
      <h1 className="sr-only">Room editor</h1>
      <div className="absolute inset-0">
        <RoomScene />
      </div>
      <p className="pointer-events-none absolute top-4 left-4 rounded-lg bg-white/90 px-3 py-2 text-sm text-stone-600 shadow-sm">
        Drag to orbit, scroll to zoom.
      </p>
    </div>
  );
}
