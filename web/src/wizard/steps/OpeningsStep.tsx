import type { OpeningKind } from "@roomcraft/shared";
import { useEffect } from "react";
import { useFieldArray, useFormContext, useWatch } from "react-hook-form";
import { usePreferences } from "../../app/preferences";
import { FieldError } from "../../components/FieldError";
import { RoomPlan } from "../../components/RoomPlan";
import { ROOM_LIMITS } from "../../domain/limits";
import { findFreeSpot } from "../../domain/room";
import { OpeningCard } from "./OpeningCard";
import type { WizardValues } from "../wizardSchema";

const NEW_OPENING = {
  door: { width: 0.9, height: 2.1, sill: 0 },
  window: { width: 1.2, height: 1.2, sill: 0.9 },
} as const;

export function OpeningsStep() {
  const { control, formState, trigger } = useFormContext<WizardValues>();
  const { fields, append, remove } = useFieldArray({ control, name: "openings", keyName: "key" });
  const units = usePreferences((state) => state.units);
  const [width, depth, height, openings] = useWatch({
    control,
    name: ["width", "depth", "height", "openings"],
  });

  // Openings constrain each other, so any change re-checks all of them.
  useEffect(() => {
    void trigger("openings");
  }, [openings, trigger]);

  const errors = formState.errors.openings;
  const listError = errors?.message ?? errors?.root?.message;
  const invalidIds = new Set(
    openings.filter((_, index) => errors?.[index] !== undefined).map((opening) => opening.id),
  );
  const full = openings.length >= ROOM_LIMITS.openings;

  const add = (kind: OpeningKind) => {
    const size = NEW_OPENING[kind];
    const spot = findFreeSpot({ width, depth, height, openings }, size.width);
    append({
      id: `${kind}-${crypto.randomUUID().slice(0, 8)}`,
      kind,
      ...(spot ?? { wall: "north", offset: 0 }),
      ...size,
    });
  };

  return (
    <div className="grid gap-8 lg:grid-cols-[1.3fr_1fr]">
      <div className="space-y-4">
        {fields.map((field, index) => (
          <OpeningCard
            key={field.key}
            index={index}
            ordinal={openings.slice(0, index + 1).filter((o) => o.kind === field.kind).length}
            onRemove={() => {
              remove(index);
            }}
          />
        ))}
        <FieldError id="openings-error" message={listError} />
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            className="btn btn-secondary"
            disabled={full}
            onClick={() => {
              add("door");
            }}
          >
            Add a door
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            disabled={full}
            onClick={() => {
              add("window");
            }}
          >
            Add a window
          </button>
        </div>
      </div>
      <div className="lg:sticky lg:top-6 lg:self-start">
        <RoomPlan
          room={{ width, depth, openings }}
          units={units}
          invalidOpeningIds={invalidIds}
          className="w-full"
        />
      </div>
    </div>
  );
}
