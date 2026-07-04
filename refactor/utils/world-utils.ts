import type { Entity } from "../entities";
import type {
  WorldData,
} from "../components";

import type {
  ChunkPosHash,
} from "../types/chunk";


export function worldGetChunk(worldData: WorldData, chunkPosHash: ChunkPosHash): Entity | undefined {
  return worldData.chunks.get(chunkPosHash);
}

