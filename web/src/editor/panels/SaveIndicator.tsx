import { useEffect, useState } from "react";
import { formatSince } from "../../domain/dates";
import { useEditor } from "../state/useEditor";

const TICK_MS = 30_000;

/** "Saved just now", "Saving…", or a retry notice, kept up to date as time passes. */
export function SaveIndicator() {
  const save = useEditor((state) => state.save);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now());
    }, TICK_MS);
    return () => {
      clearInterval(timer);
    };
  }, []);

  const text =
    save.state === "saving"
      ? "Saving…"
      : save.state === "error"
        ? "Not saved yet. Retrying…"
        : save.savedAt === null
          ? "All changes saved"
          : `Saved ${formatSince(save.savedAt, Math.max(now, save.savedAt))}`;

  return (
    <p
      role="status"
      className={`text-xs ${save.state === "error" ? "text-amber-700" : "text-stone-500"}`}
    >
      {text}
    </p>
  );
}
