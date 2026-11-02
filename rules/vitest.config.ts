import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    // The emulator is shared state; files run one after another.
    fileParallelism: false,
  },
});
