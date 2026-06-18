import { mat4, vec3, vec4 } from "gl-matrix";
import { Chunk, type ChunkPos, type ChunkPosHash, calculateChunkPosHash } from "./chunk";
import Perlin from "../thirdparty/perlin";

export type WorldInfo = {
  readonly CHUNK_HEIGHT: number;
  readonly CHUNK_SIZE: number;
  readonly RENDER_DISTANCE: number, // How many chunks to render from the player
}

export class World {
  public readonly info: WorldInfo = {
    CHUNK_HEIGHT: 32,
    CHUNK_SIZE: 16,
    RENDER_DISTANCE: 8,
  };

  private seed: number;
  private noise: Perlin;
  private chunks: Map<ChunkPosHash, Chunk>;

  constructor(seed: number | null, playerPosition: vec3) {
    if (typeof seed == null)
      this.seed = Math.random();
    else
      this.seed = seed as number;

    this.noise = new Perlin(this.seed);

    this.chunks = new Map<ChunkPosHash, Chunk>();

    const rd = this.info.RENDER_DISTANCE;
    for (let i = -rd; i <= rd; i++) {
      for (let j = -rd; j <= rd; j++) {
        const chunkPos = calculateChunkPosHash({
          x: i + playerPosition[0],
          z: j + playerPosition[2],
        });
        this.addChunk(new Chunk(this, chunkPos));
      }
    }
  }

  public getNoise() { return this.noise; }

  public getChunks() { return this.chunks; }

  public getChunk(chunkPosHash: ChunkPosHash) { return this.chunks.get(chunkPosHash); }

  public addChunk(chunk: Chunk) {
    this.chunks.set(chunk.getChunkPosHash(), chunk);
  }

  public unloadChunk(gl: WebGLRenderingContext, chunk: Chunk) {
    // TODO: Save the chunk to disk so we can load it while keeping player's modifications
    chunk.unload(gl);
    this.chunks.delete(chunk.getChunkPosHash());
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

  public update(gl: WebGLRenderingContext, playerPosition: vec3) {
    // for (const chunk of this.chunks.values()) {
    //   if (chunk.getNeedRedraw()) {
    //     chunk.update(gl, this);
    //   }
    // }
    // return;

    // Desire chunks
    const desireChunks: Set<ChunkPosHash> = new Set<ChunkPosHash>();
    const x = Math.floor(playerPosition[0] / this.info.CHUNK_SIZE);
    const z = Math.floor(playerPosition[2] / this.info.CHUNK_SIZE);

    const rd = this.info.RENDER_DISTANCE;
    for (let i = -rd; i <= rd; i++) {
      for (let j = -rd; j <= rd; j++) {
        const chunkPos = calculateChunkPosHash({
          x: i + x,
          z: j + z,
        });
        desireChunks.add(chunkPos);
      }
    }

    // Add desire chunks to chunk list
    for (const desireChunk of desireChunks) {
      if (!this.chunks.has(desireChunk)) {
        this.addChunk(new Chunk(this, desireChunk));
      }
    }

    for (const chunk of this.chunks.values()) {
      // Unload chunks that's not in desire chunk list
      if (!desireChunks.has(chunk.getChunkPosHash())) {
        this.unloadChunk(gl, chunk);
      }

      if (chunk.getNeedRedraw()) {
        chunk.update(gl, this);
      }
    }
  }
}
