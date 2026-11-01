import type { RouteObject } from "react-router";
import { Landing } from "../routes/Landing";
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
      {
        path: "new",
        lazy: {
          Component: async () => (await import("../wizard/NewProjectWizard")).NewProjectWizard,
        },
      },
      {
        path: "p/:projectId",
        // Lazy so three.js is only downloaded when the editor opens.
        lazy: {
          loader: async () => (await import("../editor/loadProject")).editorLoader,
          Component: async () => (await import("../editor/EditorRoute")).EditorRoute,
          ErrorBoundary: async () => (await import("../editor/EditorError")).EditorError,
        },
      },
      { path: "s/:shareId", Component: SharedPlan },
      { path: "*", Component: NotFound },
    ],
  },
];
