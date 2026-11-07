import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import { NeutralToneMapping, type Texture } from "three";
import type { WebGLPathTracer } from "three-gpu-pathtracer";
import { useEditor } from "../state/useEditor";

/** Samples per pixel: clean soft shadows in a few seconds on a laptop GPU. */
export const PHOTO_SAMPLES = 128;
const SKY = "#ffffff";
const GROUND = "#d6cfc7";

/**
 * While a photo is taken, path traces the current view in place of the normal
 * drawing, so the picture develops on screen, then hands the image to the store.
 * The tracer (and its BVH library) only loads when the first photo is taken.
 *
 * WebGLPathTracer is deprecated upstream in favour of a WebGPU tracer; the editor
 * draws with WebGL, so the version stays pinned until the editor moves to WebGPU.
 */
export function PhotoRenderer() {
  const get = useThree((state) => state.get);
  const setProgress = useEditor((state) => state.setPhotoProgress);
  const finish = useEditor((state) => state.finishPhoto);
  const tracer = useRef<WebGLPathTracer | null>(null);
  const finished = useRef(false);

  useEffect(() => {
    const controller = new AbortController();
    const { gl, scene, camera, controls } = get();
    // The canvas is flat because the effects tone map; the tracer draws straight to it.
    const toneMapping = gl.toneMapping;
    gl.toneMapping = NeutralToneMapping;
    setControlsEnabled(controls, false);
    // The tracer reads its environment from pixel data, which the editor's PMREM map has
    // not got: a sky-to-floor gradient lights the photo instead, and is put back after.
    const environment = scene.environment;
    let sky: Texture | null = null;
    import("three-gpu-pathtracer")
      .then(({ GradientEquirectTexture, WebGLPathTracer }) => {
        if (controller.signal.aborted) return;
        const gradient = new GradientEquirectTexture(64);
        gradient.topColor.set(SKY);
        gradient.bottomColor.set(GROUND);
        gradient.update();
        scene.environment = sky = gradient;
        const pathTracer = new WebGLPathTracer(gl);
        pathTracer.tiles.set(2, 2);
        pathTracer.bounces = 6;
        pathTracer.filterGlossyFactor = 0.5;
        pathTracer.minSamples = 1;
        pathTracer.renderDelay = 0;
        pathTracer.fadeDuration = 0;
        pathTracer.rasterizeScene = false;
        pathTracer.setScene(scene, camera);
        tracer.current = pathTracer;
      })
      .catch((error: unknown) => {
        console.warn("Could not take the photo", error);
        if (!controller.signal.aborted) finish(null);
      });
    return () => {
      controller.abort();
      tracer.current?.dispose();
      tracer.current = null;
      scene.environment = environment;
      sky?.dispose();
      gl.toneMapping = toneMapping;
      setControlsEnabled(controls, true);
    };
  }, [get, finish]);

  // Priority 1 takes over drawing from R3F while the photo is being made.
  useFrame(({ gl }) => {
    const pathTracer = tracer.current;
    if (!pathTracer || finished.current) return;
    pathTracer.renderSample();
    const samples = Math.floor(pathTracer.samples);
    setProgress(Math.min(samples / PHOTO_SAMPLES, 1));
    if (samples >= PHOTO_SAMPLES) {
      finished.current = true;
      // Read straight after drawing, before the browser presents and clears the buffer.
      finish(gl.domElement.toDataURL("image/jpeg", 0.92));
    }
  }, 1);

  return null;
}

/** The camera must hold still while the samples add up. */
function setControlsEnabled(controls: unknown, enabled: boolean) {
  if (controls && typeof controls === "object" && "enabled" in controls) {
    controls.enabled = enabled;
  }
}
