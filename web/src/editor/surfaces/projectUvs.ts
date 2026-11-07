import { BufferAttribute, type BufferGeometry } from "three";

/**
 * Replaces a geometry's texture coordinates with box-projected ones in metres:
 * each vertex takes the two coordinates across the axis its normal points along.
 * A texture then tiles at the same real-world size on every piece, whatever its
 * dimensions, instead of stretching once across each face.
 */
export function projectUvs<T extends BufferGeometry>(geometry: T): T {
  const position = geometry.getAttribute("position");
  const normal = geometry.getAttribute("normal");
  const uv = new Float32Array(position.count * 2);
  for (let index = 0; index < position.count; index++) {
    const nx = Math.abs(normal.getX(index));
    const ny = Math.abs(normal.getY(index));
    const nz = Math.abs(normal.getZ(index));
    const x = position.getX(index);
    const y = position.getY(index);
    const z = position.getZ(index);
    const [u, v] = nx >= ny && nx >= nz ? [z, y] : ny >= nz ? [x, z] : [x, y];
    uv[index * 2] = u;
    uv[index * 2 + 1] = v;
  }
  geometry.setAttribute("uv", new BufferAttribute(uv, 2));
  return geometry;
}
