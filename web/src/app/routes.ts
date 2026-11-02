import { redirect, type RouteObject } from "react-router";
import { Landing } from "../routes/Landing";
import { NotFound } from "../routes/NotFound";
import { AppLayout } from "./AppLayout";
import { LoadingScreen } from "./LoadingScreen";
import { RouteError } from "./RouteError";

// Everything past the landing page is lazy: the wizard, Firebase and three.js
// download only when they are needed.
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
        path: "demo",
        // The loader always redirects; there is nothing of its own to render.
        Component: () => null,
        lazy: {
          loader: async () => (await import("../project/startDemo")).demoLoader,
          ErrorBoundary: async () => (await import("../editor/EditorError")).EditorError,
        },
      },
      // Links from before the demo became a saved room.
      { path: "p/demo", loader: () => redirect("/demo") },
      {
        path: "p/:projectId",
        handle: { fullHeight: true },
        lazy: {
          loader: async () => (await import("../editor/loadProject")).editorLoader,
          Component: async () => (await import("../editor/EditorRoute")).EditorRoute,
          ErrorBoundary: async () => (await import("../editor/EditorError")).EditorError,
        },
      },
      {
        path: "projects",
        lazy: {
          loader: async () => (await import("../projects/myRoomsLoader")).myRoomsLoader,
          Component: async () => (await import("../projects/MyRoomsRoute")).MyRoomsRoute,
        },
      },
      {
        path: "s/:shareId",
        handle: { fullHeight: true },
        lazy: {
          loader: async () => (await import("../share/sharedPlanLoader")).sharedPlanLoader,
          Component: async () => (await import("../share/SharedPlanRoute")).SharedPlanRoute,
          ErrorBoundary: async () => (await import("../share/SharedPlanError")).SharedPlanError,
        },
      },
      { path: "*", Component: NotFound },
    ],
  },
];
