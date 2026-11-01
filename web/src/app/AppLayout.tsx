import { Link, NavLink, Outlet } from "react-router";
import { ApiStatus } from "./ApiStatus";
import { Logo } from "./Logo";

export function AppLayout() {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="border-b border-stone-200 bg-white">
        <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link
            to="/"
            className="flex items-center gap-2 rounded-md font-semibold tracking-tight focus-visible:outline-2 focus-visible:outline-teal-700"
          >
            <Logo className="size-7" />
            Roomcraft
          </Link>
          <nav aria-label="Main">
            <NavLink
              to="/new"
              className="rounded-md px-3 py-2 text-sm font-medium text-stone-600 hover:text-stone-900 focus-visible:outline-2 focus-visible:outline-teal-700 aria-[current=page]:text-teal-800"
            >
              New room
            </NavLink>
          </nav>
        </div>
      </header>

      <main className="flex flex-1 flex-col">
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
