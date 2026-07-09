import { ECS } from "../ecs";
import type { Entity } from "../entities";
import type {
  WorldData,
  WorldInfo,
} from "../components";

import type {
  ChunkPosHash,
} from "../types/chunk";

import { ChunkUtils } from "./index";


export function worldCalcChunkPos(
  worldInfo: WorldInfo,
  worldX: number,
  worldZ: number
): [x: number, z: number] {
  const chunkX = Math.floor(worldX / worldInfo.CHUNK_SIZE);
  const chunkZ = Math.floor(worldZ / worldInfo.CHUNK_SIZE);
  return [chunkX, chunkZ]
}

export function worldGetChunk(worldData: WorldData, chunkPosHash: ChunkPosHash): Entity | undefined {
  return worldData.chunks.get(chunkPosHash);
}

export function worldGetChunkByPos(
  worldInfo: WorldInfo,
  worldData: WorldData,
  worldX: number,
  worldY: number,
  worldZ: number
): Entity | undefined {
  if (worldY < 0 || worldY >= worldInfo.CHUNK_HEIGHT) return 0;

  const [chunkX, chunkZ] = worldCalcChunkPos(worldInfo, worldX, worldZ);
  const chunkPosHash = ChunkUtils.calculateChunkPosHash({x: chunkX, z: chunkZ});
  return worldGetChunk(worldData, chunkPosHash);
}

export function worldGetBlock(
  ecs: ECS,
  worldInfo: WorldInfo,
  worldData: WorldData,
  worldX: number,
  worldY: number,
  worldZ: number
) {
  if (worldY < 0 || worldY >= worldInfo.CHUNK_HEIGHT) return 0;

  const [chunkX, chunkZ] = worldCalcChunkPos(worldInfo, worldX, worldZ);
  const chunkPosHash = ChunkUtils.calculateChunkPosHash({x: chunkX, z:  chunkZ});

  const chunk = worldGetChunk(worldData, chunkPosHash);
  if (!chunk) return 0; // Chunk 未載入視為空氣

  const chunkData = ecs.getComponent(chunk, "ChunkData");
  if (!chunkData) return 0;

  const localX = worldX - (chunkX * worldInfo.CHUNK_SIZE);
  const localZ = worldZ - (chunkZ * worldInfo.CHUNK_SIZE);

  return ChunkUtils.chunkGetBlock(chunkData, worldInfo, localX, worldY, localZ);
}

export function worldSetBlock(
  ecs: ECS,
  worldData: WorldData,
  worldInfo: WorldInfo,
  worldX: number, worldY: number, worldZ: number,
  id: number
) {
  const chunk = worldGetChunkByPos(worldInfo, worldData, worldX, worldY, worldZ);
  if (!chunk) return;

  const chunkData = ecs.getComponent(chunk, "ChunkData")!;
  const [chunkX, chunkZ] = worldCalcChunkPos(worldInfo, worldX, worldZ);
  const localX = worldX - (chunkX * worldInfo.CHUNK_SIZE);
  const localZ = worldZ - (chunkZ * worldInfo.CHUNK_SIZE);

  ChunkUtils.chunkSetBlock(ecs, chunk, chunkData, worldData, worldInfo, localX, worldY, localZ, id);
}

export function worldRemoveBlock(
  ecs: ECS,
  worldData: WorldData,
  worldInfo: WorldInfo,
  worldX: number, worldY: number, worldZ: number
) {
  const chunk = worldGetChunkByPos(worldInfo, worldData, worldX, worldY, worldZ);
  if (!chunk) return;

  const chunkData = ecs.getComponent(chunk, "ChunkData")!;
  const [chunkX, chunkZ] = worldCalcChunkPos(worldInfo, worldX, worldZ);
  const localX = worldX - (chunkX * worldInfo.CHUNK_SIZE);
  const localZ = worldZ - (chunkZ * worldInfo.CHUNK_SIZE);

  ChunkUtils.chunkSetBlock(ecs, chunk, chunkData, worldData, worldInfo, localX, worldY, localZ, 0); // Set block to AIR
}
