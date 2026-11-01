import { isRouteErrorResponse, Link, useRouteError } from "react-router";

export function EditorError() {
  const error = useRouteError();
  const notFound = isRouteErrorResponse(error) && error.status === 404;

  return (
    <div role="alert" className="mx-auto w-full max-w-2xl px-4 py-16 sm:px-6">
      <h1 className="text-3xl font-semibold tracking-tight">
        {notFound ? "We couldn't find that room" : "The editor hit a problem"}
      </h1>
      <p className="mt-4 text-stone-600">
        {notFound
          ? "Rooms are saved in the browser they were created in. Open it there, or start a new one."
          : "Reloading the page usually fixes it."}
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link to="/new" className="btn btn-primary">
          Start a new room
        </Link>
        <Link to="/p/demo" className="btn btn-secondary">
          Open the demo room
        </Link>
      </div>
    </div>
  );
}
