# Models

`potted-plant.glb` is [potted_plant_01](https://polyhaven.com/a/potted_plant_01) from
[Poly Haven](https://polyhaven.com), licensed [CC0](https://polyhaven.com/license): free to use,
change and redistribute, no credit required.

Prepared from the 1k glTF download (6.3 MB) with
[glTF Transform](https://gltf-transform.dev):

```sh
npx @gltf-transform/cli@4.5.1 optimize potted_plant_01.gltf potted-plant.glb \
  --compress meshopt --texture-compress webp --texture-size 512 \
  --simplify-ratio 0.2 --simplify-error 0.02
```

The result is 512 KB with about 35,000 triangles. Meshopt compression needs no decoder from a
CDN, unlike Draco. Its quantized vertices are converted back to floats when loaded
(`../../floatGeometry.ts`), because the photo's path tracer cannot merge them.
