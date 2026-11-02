import { useEditor } from "../state/useEditor";

export function WalkHint() {
  const walking = useEditor((state) => state.cameraMode === "walk");
  if (!walking) return null;
  return (
    <p className="max-w-xs rounded-lg bg-white/95 px-3 py-2 text-sm text-stone-700 shadow-lg">
      Click the room to look around. Walk with W A S D or the arrow keys. Press Esc to free the
      mouse.
    </p>
  );
}
