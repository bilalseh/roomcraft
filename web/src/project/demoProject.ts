import seed from "@roomcraft/shared/seed/demo-project.json";
import { projectSchema, type Project } from "../domain/project";

const SEEDED_AT = "2026-11-01T00:00:00.000Z";

/** The furnished demo room from shared/seed. */
export function demoProject(): Project {
  return projectSchema.parse({ id: "demo", ...seed, createdAt: SEEDED_AT, updatedAt: SEEDED_AT });
}

/** The demo room as one person's project, with an id that finds it again next time. */
export function demoProjectFor(uid: string, now: Date): Project {
  const timestamp = now.toISOString();
  return { ...demoProject(), id: demoProjectId(uid), createdAt: timestamp, updatedAt: timestamp };
}

export function demoProjectId(uid: string): string {
  return `demo-${uid}`;
}
