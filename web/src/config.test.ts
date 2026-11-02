import { describe, expect, it } from "vitest";
import { parseConfig } from "./config";

const validEnv = {
  VITE_API_URL: "https://api.example/",
  VITE_FIREBASE_API_KEY: "key",
  VITE_FIREBASE_AUTH_DOMAIN: "demo.firebaseapp.com",
  VITE_FIREBASE_PROJECT_ID: "demo",
  VITE_FIREBASE_APP_ID: "1:2:web:3",
};

describe("parseConfig", () => {
  it("maps environment variables and trims the trailing slash of the API URL", () => {
    expect(parseConfig(validEnv)).toEqual({
      apiUrl: "https://api.example",
      firebaseEmulators: false,
      firebase: {
        apiKey: "key",
        authDomain: "demo.firebaseapp.com",
        projectId: "demo",
        appId: "1:2:web:3",
      },
    });
  });

  it("names every missing or empty variable", () => {
    const env = { ...validEnv, VITE_FIREBASE_API_KEY: "", VITE_FIREBASE_APP_ID: undefined };

    expect(() => parseConfig(env)).toThrow(
      "Missing or empty environment variables: VITE_FIREBASE_API_KEY, VITE_FIREBASE_APP_ID.",
    );
  });
});
