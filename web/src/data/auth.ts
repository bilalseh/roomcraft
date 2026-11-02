import type { Auth, User } from "firebase/auth";
import { create } from "zustand";
import { config } from "../config";
import { firebaseApp } from "./firebase";

export interface Account {
  uid: string;
  /** Signed in without an account: rooms live in this browser until linked to Google. */
  anonymous: boolean;
  name: string | null;
  email: string | null;
}

interface AccountState {
  status: "loading" | "ready";
  account: Account | null;
}

export const useAccount = create<AccountState>(() => ({ status: "loading", account: null }));

let auth: Promise<Auth> | undefined;

function getAuthInstance(): Promise<Auth> {
  auth ??= Promise.all([import("firebase/auth"), firebaseApp()]).then(
    ([{ connectAuthEmulator, getAuth, onIdTokenChanged }, app]) => {
      const instance = getAuth(app);
      if (config.firebaseEmulators) {
        connectAuthEmulator(instance, "http://127.0.0.1:9099", { disableWarnings: true });
      }
      // Fires on sign-in, sign-out and when a guest account is linked to Google.
      onIdTokenChanged(instance, (user) => {
        useAccount.setState({ status: "ready", account: user && toAccount(user) });
      });
      return instance;
    },
  );
  return auth;
}

/** Who is signed in, once Firebase has restored any previous session. */
export async function currentAccount(): Promise<Account | null> {
  const instance = await getAuthInstance();
  await instance.authStateReady();
  return instance.currentUser && toAccount(instance.currentUser);
}

/** The signed-in account, signing in as a guest first if nobody is. */
export async function ensureSignedIn(): Promise<Account> {
  const instance = await getAuthInstance();
  await instance.authStateReady();
  if (instance.currentUser) return toAccount(instance.currentUser);
  const { signInAnonymously } = await import("firebase/auth");
  const { user } = await signInAnonymously(instance);
  return toAccount(user);
}

/** A fresh Firebase ID token for calling the API, signing in as a guest if needed. */
export async function idToken(): Promise<string> {
  await ensureSignedIn();
  const instance = await getAuthInstance();
  const user = instance.currentUser;
  if (!user) throw new Error("Not signed in");
  return user.getIdToken();
}

/**
 * Signs in with Google. A guest's account is linked rather than replaced, so
 * their rooms carry over. If that Google account already exists, it signs in
 * to it instead, and the guest rooms stay with the guest.
 */
export async function signInWithGoogle(): Promise<void> {
  const instance = await getAuthInstance();
  const firebaseAuth = await import("firebase/auth");
  const provider = new firebaseAuth.GoogleAuthProvider();
  const guest = instance.currentUser?.isAnonymous ? instance.currentUser : null;
  if (!guest) {
    await firebaseAuth.signInWithPopup(instance, provider);
    return;
  }
  try {
    const { user } = await firebaseAuth.linkWithPopup(guest, provider);
    await user.reload();
    useAccount.setState({ status: "ready", account: toAccount(user) });
  } catch (error) {
    const { FirebaseError } = await import("firebase/app");
    const alreadyUsed =
      error instanceof FirebaseError && error.code === "auth/credential-already-in-use";
    const credential = alreadyUsed
      ? firebaseAuth.GoogleAuthProvider.credentialFromError(error)
      : null;
    if (!credential) throw error;
    await firebaseAuth.signInWithCredential(instance, credential);
  }
}

export async function signOut(): Promise<void> {
  const [instance, { signOut: firebaseSignOut }] = await Promise.all([
    getAuthInstance(),
    import("firebase/auth"),
  ]);
  await firebaseSignOut(instance);
}

/** Starts listening for the session, so the header can show who is signed in. */
export function watchAccount(): void {
  void getAuthInstance().catch(() => {
    useAccount.setState({ status: "ready", account: null });
  });
}

function toAccount(user: User): Account {
  return {
    uid: user.uid,
    anonymous: user.isAnonymous,
    name: user.displayName,
    email: user.email,
  };
}
