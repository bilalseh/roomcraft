import { projectSchema, type Project } from "../domain/project";

// Projects live in this browser until accounts and cloud saving arrive.
const KEY_PREFIX = "roomcraft:project:";

export function saveProject(project: Project): void {
  localStorage.setItem(KEY_PREFIX + project.id, JSON.stringify(project));
}

/** Returns null when the project is missing or its stored data is unreadable. */
export function loadProject(id: string): Project | null {
  try {
    const raw = localStorage.getItem(KEY_PREFIX + id);
    if (raw === null) return null;
    const parsed = projectSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}
