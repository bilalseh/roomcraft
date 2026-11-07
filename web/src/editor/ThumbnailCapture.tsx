import { useThree } from "@react-three/fiber";
import { useEffect } from "react";
import type { CaptureOptions } from "./state/session";
import { useEditor } from "./state/useEditor";

/** About 30 KB, small enough to keep in a Firestore document. */
const THUMBNAIL: CaptureOptions = { width: 480, height: 300, type: "image/webp", quality: 0.72 };

/**
 * Lets the editor take a picture of the current view, for thumbnails and the PDF.
 * It renders a fresh frame first, through the scene's effects, so the canvas never
 * needs to keep its buffer.
 */
export function ThumbnailCapture() {
  const gl = useThree((state) => state.gl);
  const advance = useThree((state) => state.advance);
  const setCapture = useEditor((state) => state.setCaptureThumbnail);

  useEffect(() => {
    setCapture(({ width, height, type, quality } = THUMBNAIL) => {
      advance(performance.now());
      const source = gl.domElement;
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext("2d");
      if (!context || source.width === 0 || source.height === 0) return null;
      // Crop to the picture's shape, like CSS object-fit: cover, on a white background.
      const scale = Math.max(width / source.width, height / source.height);
      const cropWidth = width / scale;
      const cropHeight = height / scale;
      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, width, height);
      context.drawImage(
        source,
        (source.width - cropWidth) / 2,
        (source.height - cropHeight) / 2,
        cropWidth,
        cropHeight,
        0,
        0,
        width,
        height,
      );
      return canvas.toDataURL(type, quality);
    });
    return () => {
      setCapture(null);
    };
  }, [gl, advance, setCapture]);

  return null;
}
