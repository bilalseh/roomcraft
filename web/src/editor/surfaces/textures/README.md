# Surface textures

All from [Poly Haven](https://polyhaven.com), licensed
[CC0](https://polyhaven.com/license): free to use, change and redistribute, no credit required.

| Folder        | Poly Haven asset                                               | Real size | Maps used                 |
| ------------- | -------------------------------------------------------------- | --------- | ------------------------- |
| `wood-floor/` | [laminate_floor_02](https://polyhaven.com/a/laminate_floor_02) | 1.7 m     | colour, normal, roughness |
| `tile-floor/` | [tiled_floor_001](https://polyhaven.com/a/tiled_floor_001)     | 1.5 m     | colour, normal, roughness |
| `carpet/`     | [dirty_carpet](https://polyhaven.com/a/dirty_carpet)           | 0.6 m     | normal, roughness         |
| `plaster/`    | [plastered_wall](https://polyhaven.com/a/plastered_wall)       | 2 m       | normal, roughness         |
| `fabric/`     | [velour_velvet](https://polyhaven.com/a/velour_velvet)         | 0.28 m    | normal, roughness         |
| `wood/`       | [oak_veneer_01](https://polyhaven.com/a/oak_veneer_01)         | 1.83 m    | colour, normal, roughness |

Prepared from the 1k JPEG downloads with ffmpeg:

- **Colour maps** are converted to grey and scaled so their average is 190/255, so a material's
  colour tints them (see `COLOR_MAP_MEAN` in `../surfaces.ts`).
- **Normal maps** (OpenGL convention) are kept at 1024 px for floors and furniture wood, 512 px
  for the finer fabric, carpet and plaster.
- **Roughness maps** are grey, 512 px.

The real size is how many metres one copy of the texture covers; geometry carries texture
coordinates in metres (`../projectUvs.ts`), so every surface tiles at its real-world scale.
