# Models

All from [Poly Haven](https://polyhaven.com), licensed [CC0](https://polyhaven.com/license):
free to use, change and redistribute, no credit required.

| File               | Poly Haven asset                                                             | Used for                 |
| ------------------ | ---------------------------------------------------------------------------- | ------------------------ |
| `armchair.glb`     | [modern_arm_chair_01](https://polyhaven.com/a/modern_arm_chair_01)           | Armchair                 |
| `ottoman.glb`      | [Ottoman_01](https://polyhaven.com/a/Ottoman_01)                             | Ottoman                  |
| `dining-chair.glb` | [dining_chair_02](https://polyhaven.com/a/dining_chair_02)                   | Dining chair             |
| `coffee-table.glb` | [modern_coffee_table_01](https://polyhaven.com/a/modern_coffee_table_01)     | Coffee table             |
| `side-table.glb`   | [side_table_01](https://polyhaven.com/a/side_table_01)                       | Side table               |
| `dining-table.glb` | [wooden_table_02](https://polyhaven.com/a/wooden_table_02)                   | Dining table             |
| `bookshelf.glb`    | [steel_frame_shelves_01](https://polyhaven.com/a/steel_frame_shelves_01)     | Bookshelf                |
| `media-unit.glb`   | [modern_wooden_cabinet](https://polyhaven.com/a/modern_wooden_cabinet)       | Media unit (its cabinet) |
| `wall-art.glb`     | [hanging_picture_frame_02](https://polyhaven.com/a/hanging_picture_frame_02) | Wall art                 |
| `plant-tall.glb`   | [potted_plant_01](https://polyhaven.com/a/potted_plant_01)                   | Tall plant               |
| `vase-tall.glb`    | [ceramic_vase_01](https://polyhaven.com/a/ceramic_vase_01)                   | Decor on furniture       |
| `vase-round.glb`   | [ceramic_vase_02](https://polyhaven.com/a/ceramic_vase_02)                   | Decor on furniture       |
| `vase-jug.glb`     | [ceramic_vase_04](https://polyhaven.com/a/ceramic_vase_04)                   | Decor on furniture       |
| `succulent.glb`    | [potted_plant_04](https://polyhaven.com/a/potted_plant_04)                   | Decor on furniture       |
| `bowl.glb`         | [carved_wooden_plate](https://polyhaven.com/a/carved_wooden_plate)           | Decor on furniture       |
| `books.glb`        | [book_encyclopedia_set_01](https://polyhaven.com/a/book_encyclopedia_set_01) | Books on the bookshelf   |

The other catalog pieces (sofas, beds, storage, lamps, rugs, the mirror) are built from simple
shapes in `web/src/editor/furniture/models/`: Poly Haven has none in a modern style.

## Preparing them

`node scripts/prepare-models.mjs` rebuilds every file here from the 1k glTF downloads. It needs
ffmpeg on the PATH and runs glTF Transform with npx. For each model it:

- turns the colour map of each material that takes a piece's colour to grey, averaging 190/255
  like the surface textures, so a piece can be any colour (`scans.ts` names those materials);
- simplifies the mesh and compresses it with meshopt, with WebP textures at 512 or 1024 px.

Meshopt needs no decoder from a CDN, unlike Draco. Its quantized vertices are turned back into
floats when a model loads, because the photo's path tracer cannot merge them.

## Serving them

The live site loads these files from jsDelivr, which serves this public repository's files from
a commit, so they do not count against Firebase Hosting's daily download allowance (360 MB on
the free plan); `firebase.json` leaves them out of the upload. Development and the end-to-end
tests load them from this folder.

After changing a model, commit it, then set `MODELS_COMMIT` in
`web/src/editor/furniture/scans.ts` to that commit: a commit's files never change, so jsDelivr
and browsers can cache them for good.
