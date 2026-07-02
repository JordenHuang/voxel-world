import Perlin from "../thirdparty/perlin";
import type { ChunkPosHash } from "../types/chunk";
import type { Entity } from "../entities";

export interface WorldInfo {
  readonly CHUNK_SIZE: number;
  readonly CHUNK_HEIGHT: number;
  readonly RENDER_DISTANCE: number, // How many chunks to render from the player
}

export interface WorldData {
  name: string;
  seed: number;
  chunks: Map<ChunkPosHash, Entity>;
}
