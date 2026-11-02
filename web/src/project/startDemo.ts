import { redirect } from "react-router";
import { ensureSignedIn } from "../data/auth";
import { createProject, getProject } from "../data/projects";
import { demoProjectFor, demoProjectId } from "./demoProject";

/**
 * "Try the demo": signs in as a guest if needed, gives them their own copy of
 * the demo room, and opens it. Coming back opens the same copy.
 */
export async function demoLoader() {
  const account = await ensureSignedIn();
  const id = demoProjectId(account.uid);
  if (!(await getProject(id)))
    await createProject(demoProjectFor(account.uid, new Date()), account.uid);
  return redirect(`/p/${id}`);
}
