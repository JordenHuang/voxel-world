import type { ChunkPosHash } from "../types/chunk";
import type { Entity } from "../entities";

export interface ChunkData {
  blocks: Uint8Array;
  chunkPosHash: ChunkPosHash;

  readonly worldId: Entity; // Chunk belongs to which world
}
