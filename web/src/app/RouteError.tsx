export function RouteError() {
  return (
    <div role="alert" className="grid min-h-dvh place-items-center px-4">
      <div className="max-w-md text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Something went wrong</h1>
        <p className="mt-3 text-stone-600">
          Roomcraft hit an unexpected error. Reloading usually fixes it.
        </p>
        <button
          type="button"
          className="mt-8 btn btn-primary"
          onClick={() => {
            window.location.reload();
          }}
        >
          Reload the page
        </button>
      </div>
    </div>
  );
}
