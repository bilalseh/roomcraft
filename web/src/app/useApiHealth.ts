import { useEffect, useState } from "react";
import { fetchHealth } from "../lib/api";

export type ApiHealth =
  | { state: "checking" }
  | { state: "waking" }
  | { state: "online"; version: string }
  | { state: "offline" };

// The free API instance sleeps when idle and takes about a minute to wake up.
export const RETRY_DELAY_MS = 5_000;
export const GIVE_UP_AFTER_MS = 180_000;

/** Calls `/health` on mount, which also wakes a sleeping API, and retries until it answers. */
export function useApiHealth(): ApiHealth {
  const [health, setHealth] = useState<ApiHealth>({ state: "checking" });

  useEffect(() => {
    const controller = new AbortController();
    const deadline = Date.now() + GIVE_UP_AFTER_MS;
    let retryTimer: ReturnType<typeof setTimeout> | undefined;

    const check = async () => {
      try {
        const { version } = await fetchHealth(controller.signal);
        setHealth({ state: "online", version });
      } catch {
        if (controller.signal.aborted) return;
        if (Date.now() >= deadline) {
          setHealth({ state: "offline" });
          return;
        }
        setHealth({ state: "waking" });
        retryTimer = setTimeout(() => void check(), RETRY_DELAY_MS);
      }
    };

    void check();
    return () => {
      controller.abort();
      clearTimeout(retryTimer);
    };
  }, []);

  return health;
}
