import { useGLTF } from "@react-three/drei";
import { Suspense, useMemo } from "react";
import { DRESSING, type PropPlacement } from "./dressing";
import { ModelBoundary } from "./ModelBoundary";
import { prepareScan } from "./prepareScan";
import { modelUrl } from "./scans";

interface DecorProps {
  itemId: string;
  width: number;
  depth: number;
  height: number;
}

/** The decor standing on a piece, if it has any; nothing while it loads or if it cannot. */
export function Decor({ itemId, width, depth, height }: DecorProps) {
  const props = DRESSING[itemId]?.({ width, depth, height }) ?? [];
  if (props.length === 0) return null;
  return (
    <ModelBoundary fallback={null}>
      <Suspense fallback={null}>
        {props.map((prop, index) => (
          <Prop key={index} {...prop} />
        ))}
      </Suspense>
    </ModelBoundary>
  );
}

const AS_MODELLED = { tint: {}, fit: "natural" } as const;

function Prop({ name, at, turns = 0 }: PropPlacement) {
  const { scene } = useGLTF(modelUrl(`${name}.glb`), false, true);
  const { model } = useMemo(() => prepareScan(scene, AS_MODELLED, "#ffffff", [1, 1, 1]), [scene]);
  // The model carries its own offset, which centres it; placing it is the group's job.
  return (
    <group position={at} rotation-y={(turns * Math.PI) / 2}>
      <primitive object={model} />
    </group>
  );
}
