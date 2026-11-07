import { BufferAttribute, type BufferGeometry } from "three";

const converted = new WeakMap<BufferGeometry, BufferGeometry>();

/**
 * The geometry with every attribute as plain 32-bit floats. Compressed glTF stores
 * positions and normals as quantized integers, which WebGL draws fine but the path
 * tracer cannot merge, so a model would vanish from photos. Cached per geometry.
 */
export function floatGeometry(geometry: BufferGeometry): BufferGeometry {
  const cached = converted.get(geometry);
  if (cached) return cached;
  const result = geometry.clone();
  for (const [name, attribute] of Object.entries(geometry.attributes)) {
    if (attribute.array instanceof Float32Array && !attribute.normalized) continue;
    const { count, itemSize } = attribute;
    const values = new Float32Array(count * itemSize);
    for (let index = 0; index < count; index++) {
      // The getters undo the normalisation, so these are the real values.
      for (let component = 0; component < itemSize; component++) {
        values[index * itemSize + component] = attribute.getComponent(index, component);
      }
    }
    result.setAttribute(name, new BufferAttribute(values, itemSize));
  }
  converted.set(geometry, result);
  return result;
}
