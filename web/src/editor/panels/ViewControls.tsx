import { useEditor } from "../state/useEditor";
import type { CameraMode } from "../state/editorStore";

const MODES: { value: CameraMode; label: string }[] = [
  { value: "orbit", label: "3D" },
  { value: "plan", label: "Plan" },
  { value: "walk", label: "Walk" },
];

/** Camera mode, corner views, day or night lighting and photos, floating over the scene. */
export function ViewControls() {
  const mode = useEditor((state) => state.cameraMode);
  const setMode = useEditor((state) => state.setCameraMode);
  const night = useEditor((state) => state.lighting === "night");
  const setLighting = useEditor((state) => state.setLighting);
  const photographing = useEditor((state) => state.photo !== null);
  const startPhoto = useEditor((state) => state.startPhoto);
  const nextCorner = useEditor((state) => state.nextCorner);

  return (
    <div className="pointer-events-auto flex items-center gap-2">
      <fieldset className="inline-flex rounded-lg border border-stone-300 bg-white/95 p-0.5 text-sm shadow-sm">
        <legend className="sr-only">View</legend>
        {MODES.map((option) => (
          <label key={option.value} className="cursor-pointer">
            <input
              type="radio"
              name="camera-mode"
              value={option.value}
              checked={mode === option.value}
              onChange={() => {
                setMode(option.value);
              }}
              className="peer sr-only"
            />
            <span className="block rounded-md px-3 py-1 text-stone-700 peer-checked:bg-teal-700 peer-checked:text-white peer-focus-visible:outline-2 peer-focus-visible:outline-offset-1 peer-focus-visible:outline-teal-700">
              {option.label}
            </span>
          </label>
        ))}
      </fieldset>
      <button
        type="button"
        aria-pressed={night}
        onClick={() => {
          setLighting(night ? "day" : "night");
        }}
        className="rounded-lg border border-stone-300 bg-white/95 px-3 py-1.5 text-sm text-stone-700 shadow-sm hover:bg-white focus-visible:outline-2 focus-visible:outline-teal-700 aria-pressed:border-indigo-900 aria-pressed:bg-indigo-950 aria-pressed:text-white"
      >
        Night
      </button>
      <button
        type="button"
        onClick={nextCorner}
        disabled={photographing}
        title="Stand in the next corner at eye height, facing the room"
        className="rounded-lg border border-stone-300 bg-white/95 px-3 py-1.5 text-sm text-stone-700 shadow-sm hover:bg-white focus-visible:outline-2 focus-visible:outline-teal-700 disabled:opacity-50"
      >
        Corner view
      </button>
      <button
        type="button"
        onClick={startPhoto}
        disabled={mode === "plan" || photographing}
        title="A realistic picture of this view, to download"
        className="rounded-lg border border-stone-300 bg-white/95 px-3 py-1.5 text-sm text-stone-700 shadow-sm hover:bg-white focus-visible:outline-2 focus-visible:outline-teal-700 disabled:opacity-50"
      >
        Photo
      </button>
    </div>
  );
}
