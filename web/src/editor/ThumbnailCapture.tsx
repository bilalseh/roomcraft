import { useThree } from "@react-three/fiber";
import { useEffect } from "react";
import { useEditor } from "./state/useEditor";

const WIDTH = 480;
const HEIGHT = 300;

/**
 * Lets the editor take a small WebP picture of the current view for thumbnails.
 * It renders a fresh frame first, so the canvas never needs to keep its buffer.
 */
export function ThumbnailCapture() {
  const { gl, scene, camera } = useThree();
  const setCapture = useEditor((state) => state.setCaptureThumbnail);

  useEffect(() => {
    setCapture(() => {
      gl.render(scene, camera);
      const source = gl.domElement;
      const canvas = document.createElement("canvas");
      canvas.width = WIDTH;
      canvas.height = HEIGHT;
      const context = canvas.getContext("2d");
      if (!context || source.width === 0 || source.height === 0) return null;
      // Crop to the thumbnail's shape, like CSS object-fit: cover.
      const scale = Math.max(WIDTH / source.width, HEIGHT / source.height);
      const width = WIDTH / scale;
      const height = HEIGHT / scale;
      context.drawImage(
        source,
        (source.width - width) / 2,
        (source.height - height) / 2,
        width,
        height,
        0,
        0,
        WIDTH,
        HEIGHT,
      );
      return canvas.toDataURL("image/webp", 0.72);
    });
    return () => {
      setCapture(null);
    };
  }, [gl, scene, camera, setCapture]);

  return null;
}
