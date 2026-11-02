import { useState } from "react";
import { Dialog } from "../../components/Dialog";
import { publishShare, revokeShare } from "../../data/shares";
import { useEditor, useEditorStore } from "../state/useEditor";

/**
 * A share link opens a read-only copy of the room as it was when published.
 * Publishing again updates that copy; stopping removes it.
 */
export function ShareDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Dialog title="Share this room" open={open} onClose={onClose}>
      <Share />
    </Dialog>
  );
}

function Share() {
  const store = useEditorStore();
  const shareId = useEditor((state) => state.shareId);
  const setShareId = useEditor((state) => state.setShareId);
  const [status, setStatus] = useState<"idle" | "working" | "copied" | "error">("idle");
  const link = shareId ? `${window.location.origin}/s/${shareId}` : null;

  const run = async (action: () => Promise<void>) => {
    setStatus("working");
    try {
      await action();
      setStatus("idle");
    } catch {
      setStatus("error");
    }
  };

  const publish = () =>
    run(async () => {
      const { project, ownerId, history } = store.getState();
      if (!ownerId) throw new Error("Not signed in");
      setShareId(
        await publishShare({
          projectId: project.id,
          ownerId,
          name: project.name,
          layout: history.present,
          shareId,
        }),
      );
    });

  const stop = () =>
    run(async () => {
      if (!shareId) return;
      await revokeShare(store.getState().project.id, shareId);
      setShareId(null);
    });

  const copy = async () => {
    if (!link) return;
    await navigator.clipboard.writeText(link);
    setStatus("copied");
  };

  return (
    <div className="space-y-4 text-sm">
      {link ? (
        <>
          <p className="text-stone-600">
            Anyone with this link can look around the room in 3D. They see it as it was when you
            last published it.
          </p>
          <div className="flex gap-2">
            <label htmlFor="share-link" className="sr-only">
              Share link
            </label>
            <input
              id="share-link"
              readOnly
              value={link}
              onFocus={(event) => {
                event.target.select();
              }}
              className="min-w-0 flex-1 rounded-lg border border-stone-300 bg-stone-50 px-3 py-2"
            />
            <button type="button" className="btn h-10 btn-secondary" onClick={() => void copy()}>
              {status === "copied" ? "Copied" : "Copy"}
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="btn h-10 btn-primary"
              onClick={() => void publish()}
              disabled={status === "working"}
            >
              Update the shared copy
            </button>
            <button
              type="button"
              className="btn h-10 btn-secondary"
              onClick={() => void stop()}
              disabled={status === "working"}
            >
              Stop sharing
            </button>
          </div>
        </>
      ) : (
        <>
          <p className="text-stone-600">
            Publish a read-only copy of this room. Anyone with the link can look around it in 3D,
            without an account.
          </p>
          <button
            type="button"
            className="btn h-10 btn-primary"
            onClick={() => void publish()}
            disabled={status === "working"}
          >
            {status === "working" ? "Publishing…" : "Create a share link"}
          </button>
        </>
      )}
      {status === "error" && (
        <p role="alert" className="text-red-700">
          That did not work. Check your connection and try again.
        </p>
      )}
    </div>
  );
}
