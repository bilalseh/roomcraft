import { useState } from "react";
import { useLoaderData } from "react-router";
import { DEMO_PROJECT_ID } from "../project/demoProject";
import type { editorLoader } from "./loadProject";
import { NoticeToast } from "./panels/NoticeToast";
import { ViewControls } from "./panels/ViewControls";
import { WalkHint } from "./panels/WalkHint";
import { WarningsPanel } from "./panels/WarningsPanel";
import { SelectionCard } from "./panels/SelectionCard";
import { Sidebar } from "./panels/Sidebar";
import { RoomScene } from "./RoomScene";
import { EditorProvider } from "./state/EditorContext";
import { createEditorStore } from "./state/editorStore";
import { useAutosave } from "./state/useAutosave";
import { useEditorShortcuts } from "./state/useEditorShortcuts";
import { Toolbar } from "./Toolbar";

export function EditorRoute() {
  const project = useLoaderData<typeof editorLoader>();
  // A new store per project: the route stays mounted when moving between projects.
  return <Editor key={project.id} />;
}

function Editor() {
  const project = useLoaderData<typeof editorLoader>();
  const [store] = useState(() => createEditorStore(project));
  const isDemo = project.id === DEMO_PROJECT_ID;
  useAutosave(store, !isDemo);
  useEditorShortcuts(store);

  return (
    <EditorProvider store={store}>
      <div className="flex min-h-0 flex-1 flex-col">
        <Toolbar isDemo={isDemo} />
        <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
          <aside
            aria-label="Furniture"
            className="order-last max-h-[45vh] border-t border-stone-200 bg-stone-50 lg:order-first lg:max-h-none lg:w-80 lg:border-t-0 lg:border-r"
          >
            <Sidebar />
          </aside>
          <div className="relative min-h-[24rem] flex-1 bg-stone-200">
            <div className="absolute inset-0">
              <RoomScene />
            </div>
            <div className="pointer-events-none absolute inset-x-4 top-4 flex flex-wrap items-start justify-between gap-2">
              <WarningsPanel />
              <ViewControls />
            </div>
            <div className="pointer-events-none absolute inset-x-0 top-16 flex justify-center">
              <NoticeToast />
            </div>
            <div className="pointer-events-none absolute bottom-4 left-4">
              <SelectionCard />
              <WalkHint />
            </div>
          </div>
        </div>
      </div>
    </EditorProvider>
  );
}
