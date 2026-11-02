import { data, type LoaderFunctionArgs } from "react-router";
import { currentAccount } from "../data/auth";
import { getProject } from "../data/projects";

// Kept apart from the editor component, so finding the project never waits for three.js.
export async function editorLoader({ params }: LoaderFunctionArgs) {
  const account = await currentAccount();
  if (!account) throw data("Sign in to open this room", { status: 401 });
  // Someone else's project reads as missing, so ids reveal nothing.
  const stored = await getProject(params.projectId ?? "");
  if (!stored) throw data("Project not found", { status: 404 });
  return { ...stored, ownerId: account.uid };
}
