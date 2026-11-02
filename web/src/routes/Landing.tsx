import { Link } from "react-router";

const FEATURES = [
  {
    title: "Set up in a minute",
    body: "Answer a few questions about the room: its size, doors and windows, style and budget.",
  },
  {
    title: "Furnish in 3D",
    body: "Drag real-sized furniture across the floor. It snaps to the walls and never overlaps.",
  },
  {
    title: "Ask the assistant",
    body: "Ask for a reading corner under $400, then preview the changes before you accept them.",
  },
];

export function Landing() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
      <section className="max-w-2xl">
        <h1 className="text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
          Plan your room in 3D, with an assistant that moves the furniture for you.
        </h1>
        <p className="mt-6 text-lg text-pretty text-stone-600">
          Describe the room, furnish it with real-sized pieces, and ask for layout ideas that are
          applied straight to the 3D view. Keep an eye on the budget and share the plan when it is
          ready.
        </p>
        <div className="mt-10 flex flex-wrap gap-3">
          <Link to="/new" className="btn btn-primary">
            Start a new room
          </Link>
          <Link to="/demo" className="btn btn-secondary">
            Try the demo
          </Link>
        </div>
      </section>

      <ul className="mt-20 grid gap-6 sm:grid-cols-3">
        {FEATURES.map((feature) => (
          <li key={feature.title} className="rounded-xl border border-stone-200 bg-white p-6">
            <h2 className="font-medium">{feature.title}</h2>
            <p className="mt-2 text-sm text-stone-600">{feature.body}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
