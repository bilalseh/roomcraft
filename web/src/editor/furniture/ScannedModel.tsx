import { useGLTF } from "@react-three/drei";
import { useEffect, useMemo } from "react";
import type { ModelProps } from "./parts";
import { prepareScan } from "./prepareScan";
import { modelUrl, type Scan } from "./scans";

interface ScannedModelProps extends ModelProps {
  scan: Scan;
}

/** A piece from a model file, fitted to its catalog size and tinted with its colour. */
export function ScannedModel({ scan, ...props }: ScannedModelProps) {
  const { width, depth, color } = props;
  const height = scan.height ?? props.height;
  // Meshopt-compressed, so no Draco decoder is fetched from a CDN.
  const { scene } = useGLTF(modelUrl(scan.file), false, true);
  const { model, materials } = useMemo(
    () => prepareScan(scene, scan, color, [width, height, depth]),
    [scene, scan, color, width, height, depth],
  );

  useEffect(
    () => () => {
      for (const material of materials) material.dispose();
    },
    [materials],
  );

  const Extra = scan.extra;
  return (
    <>
      <primitive object={model} />
      {Extra && <Extra {...props} />}
    </>
  );
}
