import { useEffect, useState } from "react";
import { PHONE, useMediaQuery } from "../components/useMediaQuery";
import { useLoaderData } from "react-router";
import { AssistantPanel } from "./assistant/AssistantPanel";
import type { editorLoader } from "./loadProject";
import { OnboardingTour } from "./OnboardingTour";
import { NoticeToast } from "./panels/NoticeToast";
import { SelectionCard } from "./panels/SelectionCard";
import { Sidebar } from "./panels/Sidebar";
import { ViewControls } from "./panels/ViewControls";
import { WalkHint } from "./panels/WalkHint";
import { WarningsPanel } from "./panels/WarningsPanel";
import { PhotoPanel } from "./photo/PhotoPanel";
import { RoomScene } from "./RoomScene";
import { EditorProvider } from "./state/EditorContext";
import { createEditorStore } from "./state/editorStore";
import { useAutosave } from "./state/useAutosave";
import { useEditorShortcuts } from "./state/useEditorShortcuts";
import { Toolbar } from "./Toolbar";

export function EditorRoute() {
  const { project } = useLoaderData<typeof editorLoader>();
  // A new store per project: the route stays mounted when moving between projects.
  return <Editor key={project.id} />;
}

function Editor() {
  const { project, ownerId, shareId } = useLoaderData<typeof editorLoader>();
  const [store] = useState(() => createEditorStore(project, { ownerId, shareId }));
  const [assistantOpen, setAssistantOpen] = useState(false);
  // Phones get a viewer: the room is too small a target to edit with a finger.
  const phone = useMediaQuery(PHONE);
  useEffect(() => {
    store.getState().setReadOnly(phone);
  }, [store, phone]);
  useAutosave(store);
  useEditorShortcuts(store);

  return (
    <EditorProvider store={store}>
      <div className="flex min-h-0 flex-1 flex-col">
        <Toolbar
          compact={phone}
          assistantOpen={assistantOpen}
          onToggleAssistant={() => {
            setAssistantOpen(!assistantOpen);
          }}
        />
        <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
          <aside
            aria-label="Furniture"
            hidden={phone}
            data-tour="catalog"
            className="order-last max-h-[45vh] border-t border-stone-200 bg-stone-50 lg:order-first lg:max-h-none lg:w-80 lg:border-t-0 lg:border-r"
          >
            <Sidebar />
          </aside>
          <div data-tour="scene" className="relative min-h-[24rem] flex-1 bg-stone-200">
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
            <div className="pointer-events-none absolute right-4 bottom-4">
              <PhotoPanel />
            </div>
            <div className="pointer-events-none absolute bottom-4 left-4">
              <SelectionCard />
              <WalkHint />
              {phone && (
                <p className="max-w-xs rounded-lg bg-white/95 px-3 py-2 text-sm text-stone-700 shadow-lg">
                  You can look around here. To edit the room, open it on a tablet or computer.
                </p>
              )}
            </div>
          </div>
          {/* Stays mounted while closed, so the conversation is kept. */}
          <aside
            id="layout-assistant"
            aria-label="Assistant"
            hidden={phone || !assistantOpen}
            className="max-h-[60vh] border-t border-stone-200 lg:max-h-none lg:w-96 lg:border-t-0 lg:border-l"
          >
            <AssistantPanel
              onClose={() => {
                setAssistantOpen(false);
              }}
            />
          </aside>
        </div>
      </div>
      {!phone && <OnboardingTour />}
    </EditorProvider>
  );
}
