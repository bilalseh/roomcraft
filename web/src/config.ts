import { z } from "zod";

const envSchema = z.object({
  VITE_API_URL: z.string().min(1),
  VITE_FIREBASE_API_KEY: z.string().min(1),
  VITE_FIREBASE_AUTH_DOMAIN: z.string().min(1),
  VITE_FIREBASE_PROJECT_ID: z.string().min(1),
  VITE_FIREBASE_APP_ID: z.string().min(1),
});

export interface AppConfig {
  apiUrl: string;
  firebase: {
    apiKey: string;
    authDomain: string;
    projectId: string;
    appId: string;
  };
}

export function parseConfig(env: Record<string, unknown>): AppConfig {
  const result = envSchema.safeParse(env);
  if (!result.success) {
    const names = result.error.issues.map((issue) => issue.path.join(".")).join(", ");
    throw new Error(`Missing or empty environment variables: ${names}. See web/.env.example.`);
  }
  const vars = result.data;
  return {
    apiUrl: vars.VITE_API_URL.replace(/\/+$/, ""),
    firebase: {
      apiKey: vars.VITE_FIREBASE_API_KEY,
      authDomain: vars.VITE_FIREBASE_AUTH_DOMAIN,
      projectId: vars.VITE_FIREBASE_PROJECT_ID,
      appId: vars.VITE_FIREBASE_APP_ID,
    },
  };
}

export const config = parseConfig(import.meta.env);
