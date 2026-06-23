import { vec3 } from "gl-matrix";
import { World } from "./meshes/world";

export interface RaycastResult {
  hit: boolean
  hitPos: vec3 | null; // For block destruction
  prevPos: vec3 | null; // For block placement
  normal: vec3 | null;
}

export class Raycast {
  // https://github.com/cgyurgyik/fast-voxel-traversal-algorithm/blob/master/overview/FastVoxelTraversalOverview.md
  // https://github.com/francisengelmann/fast_voxel_traversal/blob/master/main.cpp
  public static cast(world: World, origin: vec3, direction: vec3, maxDistance: number = 5): RaycastResult {
    const dir = vec3.create();
    vec3.normalize(dir, direction);

    // Block's coordinate at origin
    let x = Math.floor(origin[0]);
    let y = Math.floor(origin[1]);
    let z = Math.floor(origin[2]);

    // Step (Which direction to go)
    const stepX = Math.sign(dir[0]);
    const stepY = Math.sign(dir[1]);
    const stepZ = Math.sign(dir[2]);

    // Distance along the ray to the next block border
    const tDeltaX = stepX !== 0 ? Math.abs(1 / dir[0]) : Infinity;
    const tDeltaY = stepY !== 0 ? Math.abs(1 / dir[1]) : Infinity;
    const tDeltaZ = stepZ !== 0 ? Math.abs(1 / dir[2]) : Infinity;

    // Distance until next intersection with block
    let tMaxX = stepX !== 0 ? (stepX > 0 ? (Math.floor(origin[0]) + 1 - origin[0]) : (origin[0] - Math.floor(origin[0]))) * tDeltaX : Infinity;
    let tMaxY = stepY !== 0 ? (stepY > 0 ? (Math.floor(origin[1]) + 1 - origin[1]) : (origin[1] - Math.floor(origin[1]))) * tDeltaY : Infinity;
    let tMaxZ = stepZ !== 0 ? (stepZ > 0 ? (Math.floor(origin[2]) + 1 - origin[2]) : (origin[2] - Math.floor(origin[2]))) * tDeltaZ : Infinity;

  let prevX = x, prevY = y, prevZ = z;
  let faceNormal = vec3.create();

    let distance = 0;
    // 給定一個最大迴圈次數作為安全防護 (通常不會超過 maxDistance * 3)
    // for (let i = 0; i < maxDistance; i++) {
    while (true) {
      // 檢查目前所在的方塊是否為實體
      // 假設你的 world.getBlock 會回傳 0 (空氣) 或其他數字 (實體)
      if (world.getBlock(x, y, z) !== 0) {
        return {
          hit: true,
          hitPos: vec3.fromValues(x, y, z),       // 破壞目標
          prevPos: vec3.fromValues(prevX, prevY, prevZ), // 放置目標
          normal: faceNormal,
        };
      }

      // 推進到下一個方塊：選擇 tMax 最小的軸前進
      prevX = x;
      prevY = y;
      prevZ = z;

      if (tMaxX < tMaxY) {
        if (tMaxX < tMaxZ) {
          x += stepX;
          distance = tMaxX;
          tMaxX += tDeltaX;
          vec3.set(faceNormal, -stepX, 0, 0); // 記錄是從 X 軸打過來的
        } else {
          z += stepZ;
          distance = tMaxZ;
          tMaxZ += tDeltaZ;
          vec3.set(faceNormal, 0, 0, -stepZ); // 從 Z 軸
        }
      } else {
        if (tMaxY < tMaxZ) {
          y += stepY;
          distance = tMaxY;
          tMaxY += tDeltaY;
          vec3.set(faceNormal, 0, -stepY, 0); // 從 Y 軸
        } else {
          z += stepZ;
          distance = tMaxZ;
          tMaxZ += tDeltaZ;
          vec3.set(faceNormal, 0, 0, -stepZ); // 從 Z 軸
        }
      }

      // 如果超過玩家的攻擊距離 (Reach distance)，停止探測
      if (distance > maxDistance) {
        break;
      }
    }

    return { hit: false, hitPos: null, prevPos: null, normal: null };
  }
}
