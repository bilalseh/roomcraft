import { useState } from "react";
import { Link, useLoaderData } from "react-router";
import { UnitsToggle } from "../components/UnitsToggle";
import { formatDateTime } from "../domain/dates";
import { RoomScene } from "../editor/RoomScene";
import { EditorProvider } from "../editor/state/EditorContext";
import { createEditorStore } from "../editor/state/editorStore";
import { ViewControls } from "../editor/panels/ViewControls";
import type { sharedPlanLoader } from "./sharedPlanLoader";

/** A published plan, read-only: look around in 3D, plan or walk mode, by day or night. */
export function SharedPlanRoute() {
  const share = useLoaderData<typeof sharedPlanLoader>();
  const [store] = useState(() =>
    createEditorStore(
      {
        id: share.id,
        name: share.name,
        ...share.layout,
        createdAt: share.publishedAt,
        updatedAt: share.publishedAt,
      },
      { readOnly: true },
    ),
  );

  return (
    <EditorProvider store={store}>
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-200 bg-white px-4 py-3 sm:px-6">
          <div className="min-w-0">
            <h1 className="truncate text-lg font-semibold">{share.name}</h1>
            <p className="text-sm text-stone-600">
              Shared plan · Published {formatDateTime(share.publishedAt)}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <UnitsToggle />
            <Link to="/new" className="btn h-10 btn-primary">
              Plan your own room
            </Link>
          </div>
        </div>
        <div className="relative min-h-[24rem] flex-1 bg-stone-200">
          <div className="absolute inset-0">
            <RoomScene />
          </div>
          <div className="pointer-events-none absolute inset-x-4 top-4 flex justify-end">
            <ViewControls />
          </div>
        </div>
      </div>
    </EditorProvider>
  );
}
