import seed from "@roomcraft/shared/seed/demo-project.json";
import { projectSchema, type Project } from "../domain/project";

export const DEMO_PROJECT_ID = "demo";

const SEEDED_AT = "2026-11-01T00:00:00.000Z";

export function demoProject(): Project {
  return projectSchema.parse({
    id: DEMO_PROJECT_ID,
    ...seed,
    createdAt: SEEDED_AT,
    updatedAt: SEEDED_AT,
  });
}
