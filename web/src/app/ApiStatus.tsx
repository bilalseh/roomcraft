import { useApiHealth, type ApiHealth } from "./useApiHealth";

const DOT_COLORS: Record<ApiHealth["state"], string> = {
  checking: "bg-stone-300",
  waking: "bg-amber-400 motion-safe:animate-pulse",
  online: "bg-emerald-500",
  offline: "bg-red-500",
};

function statusLabel(health: ApiHealth): string {
  switch (health.state) {
    case "checking":
      return "Checking the API…";
    case "waking":
      return "Waking up the API…";
    case "online":
      return `API online · v${health.version}`;
    case "offline":
      return "API offline";
  }
}

export function ApiStatus() {
  const health = useApiHealth();
  return (
    <p role="status" className="flex items-center gap-2">
      <span aria-hidden="true" className={`size-2 rounded-full ${DOT_COLORS[health.state]}`} />
      {statusLabel(health)}
    </p>
  );
}
