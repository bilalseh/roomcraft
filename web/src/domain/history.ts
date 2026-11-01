/** Undo/redo over immutable snapshots. Small documents make whole snapshots cheap. */
export interface History<T> {
  past: readonly T[];
  present: T;
  future: readonly T[];
}

export const HISTORY_LIMIT = 100;

export function startHistory<T>(present: T): History<T> {
  return { past: [], present, future: [] };
}

/** Makes `next` the present. Redo is no longer possible; the oldest steps drop past the limit. */
export function record<T>(history: History<T>, next: T, limit = HISTORY_LIMIT): History<T> {
  if (next === history.present) return history;
  return { past: [...history.past, history.present].slice(-limit), present: next, future: [] };
}

export function undo<T>(history: History<T>): History<T> {
  const previous = history.past.at(-1);
  if (previous === undefined) return history;
  return {
    past: history.past.slice(0, -1),
    present: previous,
    future: [history.present, ...history.future],
  };
}

export function redo<T>(history: History<T>): History<T> {
  const [next, ...rest] = history.future;
  if (next === undefined) return history;
  return { past: [...history.past, history.present], present: next, future: rest };
}
