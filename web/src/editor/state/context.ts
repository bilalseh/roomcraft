import { createContext } from "react";
import type { EditorStore } from "./editorStore";

export const EditorContext = createContext<EditorStore | null>(null);
