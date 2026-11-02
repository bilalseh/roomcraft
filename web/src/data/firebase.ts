import type { FirebaseApp } from "firebase/app";
import type { Firestore } from "firebase/firestore";
import { config } from "../config";

// Firebase loads on demand, so the landing page does not download it.
let app: Promise<FirebaseApp> | undefined;
let firestore: Promise<Firestore> | undefined;

export function firebaseApp(): Promise<FirebaseApp> {
  app ??= import("firebase/app").then(({ initializeApp }) => initializeApp(config.firebase));
  return app;
}

export function database(): Promise<Firestore> {
  firestore ??= Promise.all([import("firebase/firestore"), firebaseApp()]).then(
    ([{ initializeFirestore }, instance]) =>
      initializeFirestore(instance, { ignoreUndefinedProperties: true }),
  );
  return firestore;
}

/** True for Firestore's "you may not read this", which the app treats as "not found". */
export function isPermissionDenied(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "permission-denied"
  );
}
