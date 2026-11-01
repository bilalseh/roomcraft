import type { RouteObject } from "react-router";
import { Landing } from "../routes/Landing";
import { NewProject } from "../routes/NewProject";
import { NotFound } from "../routes/NotFound";
import { SharedPlan } from "../routes/SharedPlan";
import { AppLayout } from "./AppLayout";
import { LoadingScreen } from "./LoadingScreen";
import { RouteError } from "./RouteError";

export const routes: RouteObject[] = [
  {
    Component: AppLayout,
    ErrorBoundary: RouteError,
    HydrateFallback: LoadingScreen,
    children: [
      { index: true, Component: Landing },
      { path: "new", Component: NewProject },
      {
        path: "p/:projectId",
        // Lazy so three.js is only downloaded when the editor opens.
        lazy: { Component: async () => (await import("../editor/EditorRoute")).EditorRoute },
      },
      { path: "s/:shareId", Component: SharedPlan },
      { path: "*", Component: NotFound },
    ],
  },
];
