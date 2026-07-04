import type {
  WorldInfo,
  ChunkData,
} from "../components";

import type {
  ChunkPos,
  ChunkPosHash,
} from "../types/chunk";

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

