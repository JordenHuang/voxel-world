import Perlin from "../thirdparty/perlin";
import type { ChunkPos, ChunkPosHash } from "../types/chunk";
import type { Entity } from "../entities";

export interface WorldInfo {
  readonly CHUNK_HEIGHT: number;
  readonly CHUNK_SIZE: number;
  readonly RENDER_DISTANCE: number, // How many chunks to render from the player
}

export interface WorldData {
  name: string;
  seed: number;
  // noise: Perlin;
  chunks: Map<ChunkPosHash, Entity>;
  noise: Perlin;
}
