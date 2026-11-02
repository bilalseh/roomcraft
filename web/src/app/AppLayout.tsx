import { Link, NavLink, Outlet, useMatches, useNavigation } from "react-router";
import { AccountMenu } from "./AccountMenu";
import { ApiStatus } from "./ApiStatus";
import { Logo } from "./Logo";

/** Routes with `handle: { fullHeight: true }` fill the window exactly and scroll inside. */
function isFullHeight(handle: unknown): boolean {
  return (
    typeof handle === "object" &&
    handle !== null &&
    "fullHeight" in handle &&
    handle.fullHeight === true
  );
}

export function AppLayout() {
  const fullHeight = useMatches().some((match) => isFullHeight(match.handle));
  const loading = useNavigation().state === "loading";

  return (
    <div className={`flex flex-col ${fullHeight ? "h-dvh" : "min-h-dvh"}`}>
      {loading && (
        <div
          role="progressbar"
          aria-label="Loading"
          className="fixed inset-x-0 top-0 z-50 h-0.5 animate-pulse bg-teal-600 motion-reduce:animate-none"
        />
      )}
      <a
        href="#main"
        className="sr-only z-50 rounded-md bg-white px-4 py-2 font-medium focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:outline-2 focus:outline-teal-700"
      >
        Skip to main content
      </a>
      <header className="border-b border-stone-200 bg-white">
        <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link
            to="/"
            className="flex items-center gap-2 rounded-md font-semibold tracking-tight focus-visible:outline-2 focus-visible:outline-teal-700"
          >
            <Logo className="size-7" />
            Roomcraft
          </Link>
          <nav aria-label="Main" className="flex items-center gap-1">
            <NavLink
              to="/new"
              className="rounded-md px-3 py-2 text-sm font-medium text-stone-600 hover:text-stone-900 focus-visible:outline-2 focus-visible:outline-teal-700 aria-[current=page]:text-teal-800"
            >
              New room
            </NavLink>
            <AccountMenu />
          </nav>
        </div>
      </header>

      <main id="main" tabIndex={-1} className="flex min-h-0 flex-1 flex-col focus:outline-none">
        <Outlet />
      </main>

      <footer className="border-t border-stone-200 bg-white">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm text-stone-500 sm:px-6">
          <p>
            Roomcraft ·{" "}
            <a
              href="https://github.com/bilalseh/roomcraft"
              className="underline-offset-2 hover:text-stone-900 hover:underline"
            >
              Source on GitHub
            </a>
          </p>
          <ApiStatus />
        </div>
      </footer>
    </div>
  );
}
