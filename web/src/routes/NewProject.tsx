import { Link } from "react-router";

export function NewProject() {
  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-16 sm:px-6">
      <h1 className="text-3xl font-semibold tracking-tight">Set up your room</h1>
      <p className="mt-4 text-stone-600">
        The setup wizard is on its way: room type, size and ceiling height, doors and windows, style
        and budget, one question at a time.
      </p>
      <Link to="/p/demo" className="mt-8 btn btn-secondary">
        Open the demo room instead
      </Link>
    </div>
  );
}
