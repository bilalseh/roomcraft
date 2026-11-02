import { useEffect, useState } from "react";
import { Dialog } from "../../components/Dialog";
import { versionThumbnailId } from "../../data/projects";
import { getThumbnail, saveThumbnail } from "../../data/thumbnails";
import { createVersion, listVersions, type Version } from "../../data/versions";
import { formatDateTime } from "../../domain/dates";
import { useEditor, useEditorStore } from "../state/useEditor";

/** Save the current layout as a named version, or bring back an earlier one. */
export function VersionsDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Dialog title="Versions" open={open} onClose={onClose}>
      <Versions onRestored={onClose} />
    </Dialog>
  );
}

function Versions({ onRestored }: { onRestored: () => void }) {
  const store = useEditorStore();
  const projectId = useEditor((state) => state.project.id);
  const restore = useEditor((state) => state.restore);
  const [versions, setVersions] = useState<Version[] | null>(null);
  const [name, setName] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "error">("idle");

  useEffect(() => {
    let current = true;
    listVersions(projectId)
      .then((loaded) => {
        if (current) setVersions(loaded);
      })
      .catch(() => {
        if (current) setStatus("error");
      });
    return () => {
      current = false;
    };
  }, [projectId]);

  const save = async () => {
    const { history, ownerId, captureThumbnail } = store.getState();
    const label = name.trim() || `Version ${(versions?.length ?? 0) + 1}`;
    setStatus("saving");
    try {
      const id = await createVersion(projectId, label, history.present);
      const image = captureThumbnail?.();
      if (image && ownerId) await saveThumbnail(versionThumbnailId(projectId, id), ownerId, image);
      setVersions(await listVersions(projectId));
      setName("");
      setStatus("idle");
    } catch {
      setStatus("error");
    }
  };

  return (
    <div className="space-y-5">
      <form
        className="flex gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          void save();
        }}
      >
        <label htmlFor="version-name" className="sr-only">
          Version name
        </label>
        <input
          id="version-name"
          value={name}
          maxLength={80}
          placeholder="Name this version"
          onChange={(event) => {
            setName(event.target.value);
          }}
          className="min-w-0 flex-1 rounded-lg border border-stone-300 px-3 py-2 text-sm focus-visible:outline-2 focus-visible:outline-teal-700"
        />
        <button type="submit" className="btn h-10 btn-primary" disabled={status === "saving"}>
          {status === "saving" ? "Saving…" : "Save version"}
        </button>
      </form>
      {status === "error" && (
        <p role="alert" className="text-sm text-red-700">
          Versions could not be loaded or saved. Check your connection and try again.
        </p>
      )}
      {versions === null && status !== "error" && (
        <p className="text-sm text-stone-500">Loading versions…</p>
      )}
      {versions?.length === 0 && (
        <p className="text-sm text-stone-500">
          No versions yet. Save one before trying something bold.
        </p>
      )}
      <ul className="max-h-80 space-y-2 overflow-y-auto">
        {versions?.map((version) => (
          <li
            key={version.id}
            className="flex items-center gap-3 rounded-lg border border-stone-200 p-2"
          >
            <VersionThumbnail id={versionThumbnailId(projectId, version.id)} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{version.name}</p>
              <p className="text-xs text-stone-500">{formatDateTime(version.createdAt)}</p>
            </div>
            <button
              type="button"
              onClick={() => {
                restore(version.layout);
                onRestored();
              }}
              aria-label={`Restore ${version.name}`}
              className="rounded-md border border-stone-300 px-3 py-1.5 text-sm hover:bg-stone-100 focus-visible:outline-2 focus-visible:outline-teal-700"
            >
              Restore
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function VersionThumbnail({ id }: { id: string }) {
  const [image, setImage] = useState<string | null>(null);
  useEffect(() => {
    let current = true;
    getThumbnail(id)
      .then((loaded) => {
        if (current) setImage(loaded);
      })
      .catch(() => undefined);
    return () => {
      current = false;
    };
  }, [id]);
  return image ? (
    <img src={image} alt="" className="h-12 w-20 shrink-0 rounded object-cover" />
  ) : (
    <div aria-hidden="true" className="h-12 w-20 shrink-0 rounded bg-stone-100" />
  );
}
