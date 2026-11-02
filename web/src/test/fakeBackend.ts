import { create } from "zustand";
import type { AssistRequest, AssistResponse } from "@roomcraft/shared";
import type { Account } from "../data/auth";
import type { StoredProject } from "../data/projects";
import type { SharedPlan } from "../data/shares";
import type { Version } from "../data/versions";
import type { Layout } from "../domain/layout";
import type { Project } from "../domain/project";

// An in-memory stand-in for the Firebase data layer (src/data), installed for
// every test in setup.ts. Like the real rules, it only shows people their own rooms.

interface Stored {
  stored: StoredProject;
  ownerId: string;
}

const state = {
  account: null as Account | null,
  projects: new Map<string, Stored>(),
  versions: new Map<string, Version[]>(),
  shares: new Map<string, SharedPlan>(),
  thumbnails: new Map<string, string>(),
  assistantReply: null as AssistResponse | Error | null,
  assistantRequests: [] as AssistRequest[],
  next: 0,
};

const nextId = (prefix: string) => `${prefix}-${String(++state.next)}`;

export const GUEST: Account = { uid: "guest", anonymous: true, name: null, email: null };
export const ALEX: Account = {
  uid: "alex",
  anonymous: false,
  name: "Alex Doe",
  email: "alex@example.com",
};

const useAccount = create<{ status: "loading" | "ready"; account: Account | null }>(() => ({
  status: "loading",
  account: null,
}));

export function resetFakeBackend(): void {
  state.account = null;
  state.projects.clear();
  state.versions.clear();
  state.shares.clear();
  state.thumbnails.clear();
  state.assistantReply = null;
  state.assistantRequests = [];
  state.next = 0;
  useAccount.setState({ status: "loading", account: null });
}

export function signInAs(account: Account | null): void {
  state.account = account;
  useAccount.setState({ status: "ready", account });
}

export function seedProject(
  project: Project,
  ownerId: string,
  shareId: string | null = null,
): void {
  state.projects.set(project.id, { stored: { project, shareId }, ownerId });
}

/** What a project looks like in the fake database now. */
export function savedProject(id: string): (StoredProject & { ownerId: string }) | undefined {
  const entry = state.projects.get(id);
  return entry && { ...entry.stored, ownerId: entry.ownerId };
}

const readable = (id: string) => {
  const entry = state.projects.get(id);
  return entry && entry.ownerId === state.account?.uid ? entry : undefined;
};

export const auth = {
  useAccount,
  currentAccount: () => Promise.resolve(state.account),
  ensureSignedIn: () => {
    if (!state.account) signInAs(GUEST);
    return Promise.resolve(state.account ?? GUEST);
  },
  signInWithGoogle: () => {
    signInAs(state.account?.anonymous ? { ...ALEX, uid: state.account.uid } : ALEX);
    return Promise.resolve();
  },
  signOut: () => {
    signInAs(null);
    return Promise.resolve();
  },
  watchAccount: () => {
    useAccount.setState({ status: "ready", account: state.account });
  },
};

export const projects = {
  versionThumbnailId: (projectId: string, versionId: string) => `${projectId}--${versionId}`,
  listProjects: (ownerId: string) =>
    Promise.resolve(
      [...state.projects.values()]
        .filter((entry) => entry.ownerId === ownerId)
        .map((entry) => entry.stored),
    ),
  getProject: (id: string) => Promise.resolve(readable(id)?.stored ?? null),
  createProject: (project: Project, ownerId: string) => {
    seedProject(project, ownerId);
    return Promise.resolve();
  },
  saveLayout: (id: string, layout: Layout, updatedAt: string) => {
    const entry = readable(id);
    if (!entry) return Promise.reject(new Error("permission-denied"));
    entry.stored = { ...entry.stored, project: { ...entry.stored.project, ...layout, updatedAt } };
    return Promise.resolve();
  },
  deleteProject: (stored: StoredProject) => {
    state.projects.delete(stored.project.id);
    return Promise.resolve();
  },
};

export const versions = {
  listVersions: (projectId: string) => Promise.resolve([...(state.versions.get(projectId) ?? [])]),
  createVersion: (projectId: string, name: string, layout: Layout) => {
    const version = { id: nextId("version"), name, createdAt: new Date().toISOString(), layout };
    state.versions.set(projectId, [version, ...(state.versions.get(projectId) ?? [])]);
    return Promise.resolve(version.id);
  },
};

export const shares = {
  publishShare: (input: {
    projectId: string;
    name: string;
    layout: Layout;
    shareId: string | null;
  }) => {
    const id = input.shareId ?? nextId("share");
    state.shares.set(id, {
      id,
      name: input.name,
      layout: input.layout,
      publishedAt: new Date().toISOString(),
    });
    const entry = state.projects.get(input.projectId);
    if (entry) entry.stored = { ...entry.stored, shareId: id };
    return Promise.resolve(id);
  },
  revokeShare: (projectId: string, shareId: string) => {
    state.shares.delete(shareId);
    const entry = state.projects.get(projectId);
    if (entry) entry.stored = { ...entry.stored, shareId: null };
    return Promise.resolve();
  },
  getShare: (id: string) => Promise.resolve(state.shares.get(id) ?? null),
};

export const thumbnails = {
  saveThumbnail: (id: string, _ownerId: string, image: string) => {
    state.thumbnails.set(id, image);
    return Promise.resolve();
  },
  getThumbnail: (id: string) => Promise.resolve(state.thumbnails.get(id) ?? null),
};

/** What the assistant answers next: a response, or an error to throw. */
export function setAssistantReply(reply: AssistResponse | Error): void {
  state.assistantReply = reply;
}

export function assistantRequests(): AssistRequest[] {
  return state.assistantRequests;
}

export const assistant = {
  AssistantError: class AssistantError extends Error {
    constructor(
      message: string,
      readonly status: number | null,
    ) {
      super(message);
    }
  },
  askAssistant: (request: AssistRequest) => {
    state.assistantRequests.push(request);
    const reply = state.assistantReply;
    if (!reply) return Promise.reject(new Error("No assistant reply set"));
    return reply instanceof Error ? Promise.reject(reply) : Promise.resolve(reply);
  },
};
