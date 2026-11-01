import { data, type LoaderFunctionArgs } from "react-router";
import type { Project } from "../domain/project";
import { DEMO_PROJECT_ID, demoProject } from "../project/demoProject";
import { loadProject } from "../project/localProjects";

// Kept apart from the editor component, so finding the project never waits for three.js.
export function editorLoader({ params }: LoaderFunctionArgs): Project {
  const id = params.projectId ?? "";
  const project = id === DEMO_PROJECT_ID ? demoProject() : loadProject(id);
  if (!project) throw data("Project not found", { status: 404 });
  return project;
}
