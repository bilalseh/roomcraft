import { describe, expect, it } from "vitest";
import { ALEX, GUEST, savedProject, signInAs } from "../test/fakeBackend";
import { demoLoader } from "./startDemo";

describe("demoLoader", () => {
  it("gives a new visitor a guest account and their own demo room", async () => {
    const response = await demoLoader();

    expect(response.headers.get("Location")).toBe(`/p/demo-${GUEST.uid}`);
    expect(savedProject(`demo-${GUEST.uid}`)).toMatchObject({
      ownerId: GUEST.uid,
      project: { name: "Sunny living room" },
    });
  });

  it("opens the same demo room again, with the changes kept", async () => {
    signInAs(ALEX);
    await demoLoader();
    const first = savedProject(`demo-${ALEX.uid}`);

    const response = await demoLoader();

    expect(response.headers.get("Location")).toBe(`/p/demo-${ALEX.uid}`);
    expect(savedProject(`demo-${ALEX.uid}`)).toEqual(first);
  });
});
