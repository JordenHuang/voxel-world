import { mat4, vec3, vec4 } from "gl-matrix";
import { Chunk, type ChunkPos, type ChunkPosHash, calculateChunkPosHash } from "./chunk";

export type WorldInfo = {
  readonly CHUNK_HEIGHT: number;
  readonly CHUNK_SIZE: number;
  readonly RENDER_DISTANCE: number, // How many chunks to render from the player
}

export class World {
  public readonly info: WorldInfo = {
    CHUNK_HEIGHT: 16,
    CHUNK_SIZE: 16,
    RENDER_DISTANCE: 2,
  };

  private seed: number;
  private chunks: Map<ChunkPosHash, Chunk>;

  constructor(seed: number, playerPosition: vec3) {
    this.seed = seed;

    this.chunks = new Map<ChunkPosHash, Chunk>();

    for (let i = -this.info.RENDER_DISTANCE; i <= this.info.RENDER_DISTANCE; i++) {
      for (let j = -this.info.RENDER_DISTANCE; j <= this.info.RENDER_DISTANCE; j++) {
        const chunkPos = calculateChunkPosHash({x: i, z: j});
        this.addChunk(new Chunk(this.info, chunkPos));
      }
    }
  }

  public getChunks() { return this.chunks; }

  public getChunk(chunkPosHash: ChunkPosHash) { return this.chunks.get(chunkPosHash); }

  public update(gl: WebGLRenderingContext, playerPosition: vec3) {
    for (const chunk of this.chunks.values()) {
      if (chunk.getNeedRedraw()) {
        chunk.update(gl, this);
      }
    }
  }

  public addChunk(chunk: Chunk) {
    this.chunks.set(chunk.getChunkPos(), chunk);
  }

  public getBlock(worldX: number, worldY: number, worldZ: number): number {
    if (worldY < 0 || worldY >= this.info.CHUNK_HEIGHT) return 0;

    const chunkX = Math.floor(worldX / this.info.CHUNK_SIZE);
    const chunkZ = Math.floor(worldZ / this.info.CHUNK_SIZE);

    const chunkPos = calculateChunkPosHash({x: chunkX, z:  chunkZ});
    const chunk = this.getChunk(chunkPos);
    if (!chunk) return 0; // Chunk 未載入視為空氣

    const localX = worldX - (chunkX * this.info.CHUNK_SIZE);
    const localZ = worldZ - (chunkZ * this.info.CHUNK_SIZE);

    return chunk.getBlock(this.info, localX, worldY, localZ);
  }
}
