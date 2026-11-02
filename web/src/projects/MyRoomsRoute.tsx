import { useEffect, useState } from "react";
import { Link, useLoaderData, useRevalidator } from "react-router";
import { usePreferences } from "../app/preferences";
import { Dialog } from "../components/Dialog";
import { SignInButton } from "../components/SignInButton";
import { deleteProject, type StoredProject } from "../data/projects";
import { getThumbnail } from "../data/thumbnails";
import { formatSince } from "../domain/dates";
import { formatDimensions } from "../domain/units";
import { ROOM_TYPE_LABELS } from "../project/labels";
import type { myRoomsLoader } from "./myRoomsLoader";

export function MyRoomsRoute() {
  const { account, rooms, loadedAt } = useLoaderData<typeof myRoomsLoader>();
  const { revalidate } = useRevalidator();
  const [deleting, setDeleting] = useState<StoredProject | null>(null);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl font-semibold tracking-tight">My rooms</h1>
        <Link to="/new" className="btn btn-primary">
          Start a new room
        </Link>
      </div>

      {!account && (
        <div className="mt-8 rounded-xl border border-stone-200 bg-white p-6">
          <p className="text-stone-600">Sign in to see the rooms you have planned.</p>
          <div className="mt-4">
            <SignInButton onSignedIn={() => void revalidate()} />
          </div>
        </div>
      )}

      {account?.anonymous && (
        <div className="mt-8 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <p className="text-sm text-amber-900">
            You are using a guest account, so these rooms live in this browser. Sign in with Google
            to keep them on any device.
          </p>
          <SignInButton label="Keep my rooms" onSignedIn={() => void revalidate()} />
        </div>
      )}

      {account && rooms.length === 0 && (
        <div className="mt-8 rounded-xl border border-dashed border-stone-300 p-10 text-center">
          <p className="text-stone-600">No rooms yet.</p>
          <Link to="/demo" className="mt-4 btn btn-secondary">
            Open the demo room
          </Link>
        </div>
      )}

      <ul className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {rooms.map((stored) => (
          <RoomCard
            key={stored.project.id}
            stored={stored}
            now={loadedAt}
            onDelete={() => {
              setDeleting(stored);
            }}
          />
        ))}
      </ul>

      <Dialog
        title="Delete this room?"
        open={deleting !== null}
        onClose={() => {
          setDeleting(null);
        }}
      >
        {deleting && (
          <ConfirmDelete
            stored={deleting}
            onDone={() => {
              setDeleting(null);
              void revalidate();
            }}
          />
        )}
      </Dialog>
    </div>
  );
}

function RoomCard(props: { stored: StoredProject; now: number; onDelete: () => void }) {
  const { stored, now, onDelete } = props;
  const { project } = stored;
  const units = usePreferences((state) => state.units);
  const [image, setImage] = useState<string | null>(null);

  useEffect(() => {
    let current = true;
    getThumbnail(project.id)
      .then((loaded) => {
        if (current) setImage(loaded);
      })
      .catch(() => undefined);
    return () => {
      current = false;
    };
  }, [project.id]);

  return (
    <li className="overflow-hidden rounded-xl border border-stone-200 bg-white">
      <Link
        to={`/p/${project.id}`}
        className="block focus-visible:outline-2 focus-visible:outline-teal-700"
      >
        {image ? (
          <img src={image} alt="" className="aspect-[8/5] w-full object-cover" />
        ) : (
          <div aria-hidden="true" className="aspect-[8/5] w-full bg-stone-100" />
        )}
        <div className="p-4">
          <h2 className="font-medium">{project.name}</h2>
          <p className="text-sm text-stone-600">
            {ROOM_TYPE_LABELS[project.room.type].label} ·{" "}
            {formatDimensions(project.room.width, project.room.depth, units)}
          </p>
          <p className="mt-1 text-xs text-stone-500">
            Edited {formatSince(Date.parse(project.updatedAt), now)}
          </p>
        </div>
      </Link>
      <div className="border-t border-stone-100 px-4 py-2 text-right">
        <button
          type="button"
          onClick={onDelete}
          aria-label={`Delete ${project.name}`}
          className="rounded-md px-2 py-1 text-sm text-stone-600 hover:bg-red-50 hover:text-red-700 focus-visible:outline-2 focus-visible:outline-teal-700"
        >
          Delete
        </button>
      </div>
    </li>
  );
}

function ConfirmDelete({ stored, onDone }: { stored: StoredProject; onDone: () => void }) {
  const [failed, setFailed] = useState(false);
  const [busy, setBusy] = useState(false);
  return (
    <div className="space-y-4 text-sm">
      <p className="text-stone-600">
        “{stored.project.name}”, its versions and its share link will be deleted. This cannot be
        undone.
      </p>
      {failed && (
        <p role="alert" className="text-red-700">
          The room could not be deleted. Please try again.
        </p>
      )}
      <button
        type="button"
        disabled={busy}
        className="btn h-10 bg-red-700 text-white hover:bg-red-800"
        onClick={() => {
          setBusy(true);
          deleteProject(stored)
            .then(onDone)
            .catch(() => {
              setFailed(true);
              setBusy(false);
            });
        }}
      >
        {busy ? "Deleting…" : "Delete room"}
      </button>
    </div>
  );
}
