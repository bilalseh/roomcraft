import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Units } from "../domain/units";

interface Preferences {
  units: Units;
  setUnits: (units: Units) => void;
}

export const usePreferences = create<Preferences>()(
  persist(
    (set) => ({
      units: defaultUnits(),
      setUnits: (units) => {
        set({ units });
      },
    }),
    { name: "roomcraft:preferences", partialize: ({ units }) => ({ units }) },
  ),
);

function defaultUnits(): Units {
  // The US is the one large market that still measures rooms in feet and inches.
  return navigator.language === "en-US" ? "imperial" : "metric";
}
