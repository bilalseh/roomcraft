import { currentAccount } from "../data/auth";
import { listProjects } from "../data/projects";

export async function myRoomsLoader() {
  const account = await currentAccount();
  // Read once here, so "edited 5 minutes ago" stays stable while the page is open.
  return { account, rooms: account ? await listProjects(account.uid) : [], loadedAt: Date.now() };
}
