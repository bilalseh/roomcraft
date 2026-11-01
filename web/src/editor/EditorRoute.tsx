import { useLoaderData } from "react-router";
import { usePreferences } from "../app/preferences";
import { UnitsToggle } from "../components/UnitsToggle";
import { formatUsd } from "../domain/money";
import { formatDimensions } from "../domain/units";
import { ROOM_TYPE_LABELS, STYLE_LABELS } from "../project/labels";
import type { editorLoader } from "./loadProject";
import { RoomScene } from "./RoomScene";

export function EditorRoute() {
  const project = useLoaderData<typeof editorLoader>();
  const units = usePreferences((state) => state.units);
  const { room } = project;

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-200 bg-white px-4 py-3 sm:px-6">
        <div className="min-w-0">
          <h1 className="truncate text-lg font-semibold">{project.name}</h1>
          <p className="text-sm text-stone-600">
            {ROOM_TYPE_LABELS[room.type].label} · {formatDimensions(room.width, room.depth, units)}{" "}
            · {STYLE_LABELS[room.style].label} · Budget {formatUsd(room.budget)}
          </p>
        </div>
        <UnitsToggle />
      </div>
      <div className="relative min-h-[28rem] flex-1 bg-stone-200">
        <div className="absolute inset-0">
          <RoomScene room={room} />
        </div>
        <p className="pointer-events-none absolute bottom-4 left-4 rounded-lg bg-white/90 px-3 py-2 text-sm text-stone-600 shadow-sm">
          Drag to orbit, right-drag to pan, scroll to zoom.
        </p>
      </div>
    </div>
  );
}
