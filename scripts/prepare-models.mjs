// Rebuilds web/public/models from Poly Haven's CC0 models. For each one it downloads the 1k glTF,
// turns the colour maps of the materials that take a piece's colour to grey with an average of
// 190/255 (as the surface textures are), then simplifies and compresses it with glTF Transform:
// meshopt geometry, WebP textures. Needs ffmpeg on the PATH.
// Usage: node scripts/prepare-models.mjs [work-dir]
import { execFileSync } from "node:child_process";
import {
  cpSync,
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const out = join(root, "web/public/models");
const work = process.argv[2] ?? join(tmpdir(), "roomcraft-models");
const GLTF_TRANSFORM = "@gltf-transform/cli@4.5.1";
const GREY_MEAN = 190;

/**
 * Output name: the Poly Haven asset, the materials whose colour map turns grey, the texture
 * size, how far to simplify (the share of triangles to keep, and the error allowed), and
 * any materials to leave out with their geometry.
 */
const MODELS = {
  armchair: ["modern_arm_chair_01", ["modern_arm_chair_01_pillow"], 1024, [0.5, 0.0005]],
  ottoman: ["Ottoman_01", ["Ottoman_01"], 512, [0.5, 0.0005]],
  "dining-chair": ["dining_chair_02", ["dining_chair_02"], 512, [0.3, 0.001]],
  "coffee-table": ["modern_coffee_table_01", ["modern_coffee_table_01"], 1024, [0.5, 0.0005]],
  "side-table": ["side_table_01", ["side_table_01"], 512, [0.5, 0.0005]],
  "dining-table": ["wooden_table_02", ["wooden_table_02"], 1024, [1, 0.0001]],
  bookshelf: ["steel_frame_shelves_01", ["steel_frame_shelves_01"], 1024, [0.5, 0.0005]],
  "media-unit": ["modern_wooden_cabinet", ["modern_wooden_cabinet"], 512, [0.3, 0.002]],
  // Its glass shares the frame's opaque textures, so it would hide the print.
  "wall-art": [
    "hanging_picture_frame_02",
    ["hanging_picture_frame_02_artwork"],
    1024,
    [1, 0.0001],
    ["hanging_picture_frame_02_glass"],
  ],
  "plant-tall": ["potted_plant_01", [], 512, [0.2, 0.02]],
  "vase-tall": ["ceramic_vase_01", [], 512, [0.3, 0.001]],
  "vase-round": ["ceramic_vase_02", [], 512, [0.3, 0.001]],
  "vase-jug": ["ceramic_vase_04", [], 512, [0.3, 0.001]],
  succulent: ["potted_plant_04", [], 512, [0.3, 0.005]],
  bowl: ["carved_wooden_plate", [], 512, [0.5, 0.001]],
  books: ["book_encyclopedia_set_01", [], 512, [0.1, 0.01]],
};

async function download(asset) {
  const dir = join(work, "raw", asset);
  const headers = { "User-Agent": "roomcraft-asset-script" };
  const list = await (await fetch(`https://api.polyhaven.com/files/${asset}`, { headers })).json();
  const gltf = list.gltf?.["1k"]?.gltf;
  if (!gltf) throw new Error(`Poly Haven has no 1k glTF of ${asset}`);
  const files = [
    [`${asset}.gltf`, gltf.url],
    ...Object.entries(gltf.include ?? {}).map(([p, f]) => [p, f.url]),
  ];
  for (const [path, url] of files) {
    const file = join(dir, path);
    if (existsSync(file)) continue;
    const response = await fetch(url, { headers });
    if (!response.ok) throw new Error(`${String(response.status)} for ${url}`);
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, Buffer.from(await response.arrayBuffer()));
  }
  return dir;
}

/** Runs a command; through the shell on Windows, where npx is a batch file. */
function run(command, args) {
  const shell = process.platform === "win32";
  const quoted = shell ? args.map((arg) => (/[\s"]/.test(arg) ? JSON.stringify(arg) : arg)) : args;
  return execFileSync(command, quoted, {
    shell,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
}

/** Rewrites an image as grey, scaled so its average is GREY_MEAN. */
function greyscale(image) {
  const stats = run("ffmpeg", [
    "-v",
    "error",
    "-i",
    image,
    "-vf",
    "format=gray,signalstats,metadata=print:key=lavfi.signalstats.YAVG:file=-",
    "-f",
    "null",
    "-",
  ]);
  const mean = Number(/YAVG=([\d.]+)/.exec(stats)?.[1]);
  if (!mean) throw new Error(`Could not measure ${image}`);
  const grey = image.replace(/\.\w+$/, ".grey.png");
  run("ffmpeg", [
    "-y",
    "-v",
    "error",
    "-i",
    image,
    "-vf",
    `format=gray,lut=c0='clip(val*${String(GREY_MEAN / mean)},0,255)'`,
    grey,
  ]);
  return { grey, mean };
}

mkdirSync(out, { recursive: true });
for (const [name, [asset, tinted, size, [ratio, error], dropped = []]] of Object.entries(MODELS)) {
  const stage = join(work, "stage", name);
  rmSync(stage, { recursive: true, force: true });
  cpSync(await download(asset), stage, { recursive: true });

  const gltfPath = join(stage, `${asset}.gltf`);
  const gltf = JSON.parse(readFileSync(gltfPath, "utf8"));
  for (const material of gltf.materials.filter((m) => tinted.includes(m.name))) {
    const texture = gltf.textures[material.pbrMetallicRoughness.baseColorTexture.index];
    const image = gltf.images[texture.source];
    const { grey, mean } = greyscale(join(stage, image.uri));
    image.uri = grey.slice(stage.length + 1).replaceAll("\\", "/");
    image.mimeType = "image/png";
    console.log(`${name}: ${material.name} to grey (average was ${mean.toFixed(0)})`);
  }
  for (const mesh of gltf.meshes) {
    mesh.primitives = mesh.primitives.filter(
      (primitive) => !dropped.includes(gltf.materials[primitive.material]?.name),
    );
  }
  writeFileSync(gltfPath, JSON.stringify(gltf));

  const target = join(out, `${name}.glb`);
  run("npx", [
    "--yes",
    GLTF_TRANSFORM,
    "optimize",
    gltfPath,
    target,
    "--compress",
    "meshopt",
    "--texture-compress",
    "webp",
    "--texture-size",
    String(size),
    "--simplify-ratio",
    String(ratio),
    "--simplify-error",
    String(error),
    "--instance",
    "false",
  ]);
  console.log(`${name}: ${(statSync(target).size / 1024).toFixed(0)} KB`);
}
