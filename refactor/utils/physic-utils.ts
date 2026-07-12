import { BlockId } from "./block-utils";

export function checkVoxelCollision(
  px: number, py: number, pz: number, 
  aabb: { halfWidth: number, halfHeight: number, halfDepth: number },
  getBlockId: (x: number, y: number, z: number) => number
): boolean {
  // Find the minimum and maximum voxel coordinates the AABB touches
  const pad = 0.001; 

  const minX = Math.floor(px - aabb.halfWidth + pad);
  const maxX = Math.floor(px + aabb.halfWidth - pad);
  const minY = Math.floor(py - aabb.halfHeight + pad);
  const maxY = Math.floor(py + aabb.halfHeight - pad);
  const minZ = Math.floor(pz - aabb.halfDepth + pad);
  const maxZ = Math.floor(pz + aabb.halfDepth - pad);

  // Loop through every voxel the player's body is currently touching
  for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      for (let z = minZ; z <= maxZ; z++) {
        if (getBlockId(x, y, z) !== BlockId.AIR) { // 0 is air
          return true;
        }
      }
    }
  }
  return false;
}
