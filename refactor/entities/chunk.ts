import { vec3 } from "gl-matrix";
import { ECS } from "../ecs";
import type { Entity } from "../entities/";
import type { WorldInfo } from "../components/";
import type { ChunkPosHash } from "../types/chunk";
import { ChunkUtils } from "../utils/";

// TODO: ChunkOptions

export function createChunk(ecs: ECS, worldInfo: WorldInfo, world: Entity, chunkPosHash: ChunkPosHash): Entity {
  const chunk = ecs.createEntity();

  const size = worldInfo.CHUNK_SIZE;
  const height = worldInfo.CHUNK_HEIGHT;
  const volume = size * height * size;

  const chunkPos = ChunkUtils.extractChunkPosFromHash(chunkPosHash);
  // Calculate chunk min/max boundary
  const minX = chunkPos.x * worldInfo.CHUNK_SIZE;
  const minY = 0;
  const minZ = chunkPos.z * worldInfo.CHUNK_SIZE;
  const maxX = minX + worldInfo.CHUNK_SIZE;
  const maxY = worldInfo.CHUNK_HEIGHT;
  const maxZ = minZ + worldInfo.CHUNK_SIZE;

  ecs.attachComponent(chunk, "ChunkTag", {});

  ecs.attachComponent(chunk, "VolumeBoundary", {
    boundaryMin: vec3.fromValues(minX, minY, minZ),
    boundaryMax: vec3.fromValues(maxX, maxY, maxZ),
  });

  ecs.attachComponent(chunk, "ChunkData", {
    blocks: new Uint8Array(volume),
    chunkPosHash: chunkPosHash,
    worldId: world,
  });


  return chunk;
}
