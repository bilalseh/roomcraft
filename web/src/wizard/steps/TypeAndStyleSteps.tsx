import type { RoomType } from "@roomcraft/shared";
import { useFormContext } from "react-hook-form";
import { ROOM_TYPES, STYLES } from "../../domain/room";
import { STYLE_PALETTES } from "../../domain/styles";
import { ROOM_TYPE_LABELS, STYLE_LABELS } from "../../project/labels";
import { ChoiceCards } from "../ChoiceCards";
import type { WizardValues } from "../wizardSchema";

export function RoomTypeStep() {
  const { getFieldState, setValue } = useFormContext<WizardValues>();

  // Name the room after its type, unless the person has already named it.
  const nameAfterType = (type: RoomType) => {
    if (!getFieldState("name").isDirty) setValue("name", ROOM_TYPE_LABELS[type].label);
  };

  return (
    <ChoiceCards
      name="type"
      legend="Room type"
      onChoose={nameAfterType}
      choices={ROOM_TYPES.map((type) => ({ value: type, ...ROOM_TYPE_LABELS[type] }))}
    />
  );
}

export function StyleStep() {
  return (
    <ChoiceCards
      name="style"
      legend="Style"
      choices={STYLES.map((style) => ({
        value: style,
        ...STYLE_LABELS[style],
        visual: <Swatches colors={Object.values(STYLE_PALETTES[style])} />,
      }))}
    />
  );
}

function Swatches({ colors }: { colors: string[] }) {
  return (
    <span aria-hidden="true" className="grid shrink-0 grid-cols-2 gap-1 self-center">
      {colors.map((color) => (
        <span
          key={color}
          className="size-5 rounded-full border border-stone-300"
          style={{ backgroundColor: color }}
        />
      ))}
    </span>
  );
}
