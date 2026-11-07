import { Bloom, EffectComposer, N8AO, SMAA, ToneMapping } from "@react-three/postprocessing";
import { ToneMappingMode } from "postprocessing";

interface SceneEffectsProps {
  night: boolean;
  /** Contact shadows where pieces meet the floor and walls; off for the flat plan view. */
  occlusion: boolean;
}

/**
 * The scene is drawn through these effects. Tone mapping happens here, so the
 * canvas itself is flat; Khronos PBR Neutral keeps chosen colours true. N8AO
 * needs a composer without multisampling, so SMAA smooths the edges instead.
 */
export function SceneEffects({ night, occlusion }: SceneEffectsProps) {
  return (
    <EffectComposer multisampling={0}>
      <N8AO enabled={occlusion} aoRadius={0.6} distanceFalloff={1} intensity={3} quality="medium" />
      {night ? <Bloom mipmapBlur intensity={0.7} luminanceThreshold={0.85} /> : <></>}
      <ToneMapping mode={ToneMappingMode.NEUTRAL} />
      <SMAA />
    </EffectComposer>
  );
}
