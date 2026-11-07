import { useEditor } from "../state/useEditor";

/** Progress while a photo develops in the view, then the picture to download. */
export function PhotoPanel() {
  const photo = useEditor((state) => state.photo);
  const close = useEditor((state) => state.closePhoto);
  if (!photo) return null;

  return (
    <section
      aria-label="Photo"
      className="pointer-events-auto w-80 rounded-lg bg-white/95 p-3 text-sm text-stone-700 shadow-lg"
    >
      {photo.status === "rendering" && (
        <>
          <p id="photo-progress">Taking a photo… {Math.round(photo.progress * 100)}%</p>
          <div
            role="progressbar"
            aria-labelledby="photo-progress"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(photo.progress * 100)}
            className="mt-2 h-1.5 overflow-hidden rounded bg-stone-200"
          >
            <div
              className="h-full bg-teal-700 transition-[width]"
              style={{ width: `${String(photo.progress * 100)}%` }}
            />
          </div>
          <p className="mt-2 text-xs text-stone-500">Light is traced the way a camera sees it.</p>
        </>
      )}
      {photo.status === "done" && (
        <>
          <img src={photo.image} alt="A photo of the room" className="w-full rounded" />
          <a
            href={photo.image}
            download="roomcraft-photo.jpg"
            className="mt-3 btn h-9 w-full btn-primary text-sm"
          >
            Download photo
          </a>
        </>
      )}
      {photo.status === "failed" && <p>This browser could not take the photo.</p>}
      <button type="button" onClick={close} className="mt-2 btn h-9 w-full btn-secondary text-sm">
        {photo.status === "rendering" ? "Cancel" : "Close"}
      </button>
    </section>
  );
}
