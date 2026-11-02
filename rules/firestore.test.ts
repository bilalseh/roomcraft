import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import { readFileSync } from "node:fs";
import { afterAll, beforeAll, beforeEach, describe, it } from "vitest";

let env: RulesTestEnvironment;

beforeAll(async () => {
  env = await initializeTestEnvironment({
    projectId: "demo-roomcraft",
    firestore: { rules: readFileSync(new URL("../firestore.rules", import.meta.url), "utf8") },
  });
});

afterAll(async () => {
  await env.cleanup();
});

beforeEach(async () => {
  await env.clearFirestore();
});

// The test contexts hand out Firestore's namespaced (compat) API.
const as = (uid: string) => env.authenticatedContext(uid).firestore();
const guest = () => env.unauthenticatedContext().firestore();

const layout = {
  name: "Living room",
  room: { width: 4, depth: 3 },
  furniture: [],
  materials: { floor: "wood" },
};
const project = (ownerId: string) => ({
  ownerId,
  ...layout,
  createdAt: "2026-11-01T00:00:00.000Z",
  updatedAt: "2026-11-01T00:00:00.000Z",
});

async function seed(path: string, data: Record<string, unknown>) {
  await env.withSecurityRulesDisabled(async (context) => {
    await context.firestore().doc(path).set(data);
  });
}

describe("projects", () => {
  it("lets a person create, read and list their own projects", async () => {
    await assertSucceeds(as("alice").doc("projects/p1").set(project("alice")));
    await assertSucceeds(as("alice").doc("projects/p1").get());
    await assertSucceeds(as("alice").collection("projects").where("ownerId", "==", "alice").get());
  });

  it("keeps projects private", async () => {
    await seed("projects/p1", project("alice"));

    await assertFails(as("bob").doc("projects/p1").get());
    await assertFails(guest().doc("projects/p1").get());
    await assertFails(as("bob").collection("projects").get());
    await assertFails(as("bob").doc("projects/p1").delete());
  });

  it("refuses projects created for someone else, or handed over", async () => {
    await assertFails(as("bob").doc("projects/p1").set(project("alice")));

    await seed("projects/p2", project("alice"));
    await assertFails(as("alice").doc("projects/p2").update({ ownerId: "bob" }));
  });

  it("refuses unknown fields and overlong names", async () => {
    await assertFails(
      as("alice")
        .doc("projects/p1")
        .set({ ...project("alice"), admin: true }),
    );
    await assertFails(
      as("alice")
        .doc("projects/p1")
        .set({ ...project("alice"), name: "x".repeat(81) }),
    );
  });
});

describe("versions", () => {
  it("belong to the project's owner", async () => {
    await seed("projects/p1", project("alice"));
    const version = { ...layout, createdAt: "2026-11-01T00:00:00.000Z" };

    await assertSucceeds(as("alice").doc("projects/p1/versions/v1").set(version));
    await assertSucceeds(as("alice").collection("projects/p1/versions").get());
    await assertFails(as("bob").collection("projects/p1/versions").get());
    await assertFails(as("bob").doc("projects/p1/versions/v2").set(version));
  });
});

describe("thumbnails", () => {
  const thumbnail = (ownerId: string, image = "data:image/webp;base64,AAAA") => ({
    ownerId,
    image,
    updatedAt: "2026-11-01T00:00:00.000Z",
  });

  it("are private to their owner and kept small", async () => {
    await assertSucceeds(as("alice").doc("thumbnails/p1").set(thumbnail("alice")));
    await assertFails(as("bob").doc("thumbnails/p1").get());
    await assertFails(
      as("alice")
        .doc("thumbnails/p2")
        .set(thumbnail("alice", "x".repeat(130_000))),
    );
  });

  it("can be deleted by their owner, or when they were never made", async () => {
    await seed("thumbnails/p1", thumbnail("alice"));

    await assertFails(as("bob").doc("thumbnails/p1").delete());
    await assertSucceeds(as("alice").doc("thumbnails/p1").delete());
    await assertSucceeds(as("alice").doc("thumbnails/never-made").delete());
  });
});

describe("shares", () => {
  const share = (ownerId: string) => ({
    ownerId,
    projectId: "p1",
    ...layout,
    publishedAt: "2026-11-01T00:00:00.000Z",
  });

  it("can be read by anyone with the link, but not listed", async () => {
    await seed("shares/s1", share("alice"));

    await assertSucceeds(guest().doc("shares/s1").get());
    await assertFails(guest().collection("shares").get());
  });

  it("can only be published, updated or removed by their owner", async () => {
    await assertSucceeds(as("alice").doc("shares/s1").set(share("alice")));
    await assertFails(as("bob").doc("shares/s1").set(share("bob")));
    await assertFails(as("bob").doc("shares/s1").delete());
    await assertSucceeds(as("alice").doc("shares/s1").delete());
  });
});
