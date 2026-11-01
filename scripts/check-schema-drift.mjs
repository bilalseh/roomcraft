// Fails when shared/schema or the generated TypeScript types are stale: it
// regenerates both with `pnpm schema` and compares them with what was there.
import { execSync } from "node:child_process";
import { readdir, readFile } from "node:fs/promises";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const generatedDirs = ["shared/schema", "shared/src/generated"];

async function snapshot() {
  const files = new Map();
  for (const dir of generatedDirs) {
    const entries = await readdir(join(root, dir), { recursive: true, withFileTypes: true }).catch(
      () => [],
    );
    for (const entry of entries.filter((e) => e.isFile())) {
      const path = join(entry.parentPath, entry.name);
      files.set(relative(root, path), await readFile(path, "utf8"));
    }
  }
  return files;
}

const before = await snapshot();
execSync("pnpm schema", { cwd: root, stdio: "inherit" });
const after = await snapshot();

const stale = [...new Set([...before.keys(), ...after.keys()])].filter(
  (path) => before.get(path) !== after.get(path),
);
if (stale.length > 0) {
  console.error(
    `\nGenerated schema files were stale and have been regenerated:\n${stale
      .map((path) => `  ${path}`)
      .join("\n")}\nCommit the regenerated files.`,
  );
  process.exit(1);
}
console.log("\nShared schema and generated types are up to date.");
