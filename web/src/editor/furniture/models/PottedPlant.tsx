import { useGLTF } from "@react-three/drei";
import { Suspense, useEffect, useMemo } from "react";
import { Box3, Mesh, MeshStandardMaterial, type BufferGeometry, type Material } from "three";
import { fitToBox, tintToward } from "../fitModel";
import { floatGeometry } from "../floatGeometry";
import type { ModelProps } from "../parts";
import plantUrl from "./assets/potted-plant.glb?url";
import { Plant } from "./decor";

/** The tall plant's catalog colour, which the model's leaves already have. */
const LEAF_COLOR = "#4d7c4f";
/** Leaves may spread past the footprint by this much, as real plants do. */
const SPREAD = 1.3;

/** A scanned potted plant (CC0, Poly Haven); the simple one stands in while it loads. */
export function PottedPlant(props: ModelProps) {
  return (
    <Suspense fallback={<Plant {...props} />}>
      <PlantModel {...props} />
    </Suspense>
  );
}

function PlantModel({ width, depth, height, color }: ModelProps) {
  // Meshopt-compressed, so no Draco decoder is fetched from a CDN.
  const { scene } = useGLTF(plantUrl, false, true);

  const { model, tinted } = useMemo(() => {
    const copy = scene.clone(true);
    const created: Material[] = [];
    copy.traverse((object) => {
      if (!(object instanceof Mesh)) return;
      object.geometry = floatGeometry(object.geometry as BufferGeometry);
      object.castShadow = true;
      object.receiveShadow = true;
      const material: unknown = object.material;
      if (material instanceof MeshStandardMaterial && material.name.includes("leaves")) {
        const leaves = material.clone();
        leaves.color.multiply(tintToward(color, LEAF_COLOR));
        object.material = leaves;
        created.push(leaves);
      }
    });
    const fit = fitToBox(new Box3().setFromObject(scene), width * SPREAD, height, depth * SPREAD);
    copy.scale.setScalar(fit.scale);
    copy.position.copy(fit.offset);
    return { model: copy, tinted: created };
  }, [scene, width, depth, height, color]);

  useEffect(
    () => () => {
      for (const material of tinted) material.dispose();
    },
    [tinted],
  );

  return <primitive object={model} />;
}
