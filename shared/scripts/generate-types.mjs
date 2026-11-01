// Generates TypeScript types from the JSON Schema that the API exports.
// Run it through `pnpm schema`, which exports the schema first.
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { compile } from "json-schema-to-typescript";

const schemaUrl = new URL("../schema/roomcraft.schema.json", import.meta.url);
const outputUrl = new URL("../src/generated/schema.ts", import.meta.url);

const { $defs } = JSON.parse(await readFile(schemaUrl, "utf8"));

// One declaration per definition. References between definitions resolve by
// name instead of being declared again.
const declarations = [];
for (const [name, definition] of Object.entries($defs)) {
  declarations.push(
    await compile({ ...definition, $defs }, name, {
      bannerComment: "",
      declareExternallyReferenced: false,
      additionalProperties: false,
    }),
  );
}

const banner = "// Generated from shared/schema by `pnpm schema`. Do not edit.\n\n";
await mkdir(new URL(".", outputUrl), { recursive: true });
await writeFile(outputUrl, banner + declarations.join("\n"));
console.log(`Wrote ${fileURLToPath(outputUrl)}`);
