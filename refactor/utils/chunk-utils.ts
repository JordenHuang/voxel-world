import { ECS } from "../ecs";
import type { Entity } from "../entities/";
import type {
  WorldInfo,
  WorldData,
  ChunkData,
} from "../components";

import type {
  ChunkPos,
  ChunkPosHash,
} from "../types/chunk";

import { WorldUtils } from "./index";

export function calculateChunkPosHash(chunkPos: ChunkPos): string {
  return `${chunkPos.x},${chunkPos.z}`;
}

export function extractChunkPosFromHash(hash: ChunkPosHash): ChunkPos {
  const items = hash.split(',');
  return {x: Number(items[0]), z: Number(items[1])};
}

export function chunkGetIndex(worldInfo: WorldInfo, x: number, y: number, z: number): number {
  return x + (z * worldInfo.CHUNK_SIZE) + (y * worldInfo.CHUNK_SIZE * worldInfo.CHUNK_SIZE);
}

export function chunkIsValidIndex(worldInfo: WorldInfo, x: number, y: number, z: number): boolean {
  return !(x < 0 || x >= worldInfo.CHUNK_SIZE
    || y < 0 || y >= worldInfo.CHUNK_HEIGHT
    || z < 0 || z >= worldInfo.CHUNK_SIZE);
}

export function chunkGetBlock(chunkData: ChunkData, worldInfo: WorldInfo, x: number, y: number, z: number): number {
  if (!chunkIsValidIndex(worldInfo, x, y, z)) {
    return 0; // 超出邊界視為空氣 (未來這裡要向相鄰的 Chunk 查詢)
  }
  return chunkData.blocks[chunkGetIndex(worldInfo, x, y, z)] as number;
}

export function chunkSetBlock(
  ecs: ECS,
  chunk: Entity,
  chunkData: ChunkData,
  worldData: WorldData,
  worldInfo: WorldInfo,
  x: number, y: number, z: number,
  id: number
) {
  if (chunkIsValidIndex(worldInfo, x, y, z)) {
    chunkData.blocks[chunkGetIndex(worldInfo, x, y, z)] = id;
    ecs.attachComponent(chunk, "DirtyFlag", { isDirty: true });
    const chunkPos = extractChunkPosFromHash(chunkData.chunkPosHash);

    // Inform neighbor chunks to update
    const neighbors = [
      { x: chunkPos.x + 1, z: chunkPos.z },
      { x: chunkPos.x - 1, z: chunkPos.z },
      { x: chunkPos.x, z: chunkPos.z + 1 },
      { x: chunkPos.x, z: chunkPos.z - 1 }
    ];

    for (const n of neighbors) {
      const hash = calculateChunkPosHash(n);
      const neighborEntity = WorldUtils.worldGetChunk(worldData, hash);

      if (neighborEntity !== undefined) {
        ecs.attachComponent(neighborEntity, "DirtyFlag", { isDirty: true });
      }
    }
  }
}
