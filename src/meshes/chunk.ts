import { mat4, vec3, vec4 } from "gl-matrix";
import type { Mesh } from "./mesh";
import { Model } from "./model";
import { World } from "./world";
import { CubeMesh } from "./cube-mesh";
import { ChunkMeshBuilder } from "./chunk-mesh-builder";
import { type WorldInfo } from "./world";
import Perlin from "../thirdparty/perlin";

export type ChunkPos = {x: number, z: number};
export type ChunkPosHash = string;

export function calculateChunkPosHash(chunkPos: ChunkPos): string {
  return `${chunkPos.x},${chunkPos.z}`;
}

export function extractChunkPosFromHash(hash: ChunkPosHash): ChunkPos {
  const items = hash.split(',');
  return {x: Number(items[0]), z: Number(items[1])};
}

export class Chunk {
  // public static readonly SIZE = 16;
  // public static readonly HEIGHT = 256;

  private chunkPosHash: ChunkPosHash;

  private needRedraw: boolean = true;

  // 0 = 空氣, 1 = 實體方塊
  // TODO: Should stores block id
  private blocks: Uint8Array;

  private chunkMesh: Mesh | null = null; // Used as key in world.chunks
  private chunkModel: Model | null = null;

  constructor(world: World, chunkPosHash: ChunkPosHash) {
    const size = world.info.CHUNK_SIZE;
    const height = world.info.CHUNK_HEIGHT;
    const volume = size * height * size;

    this.blocks = new Uint8Array(volume);
    this.chunkPosHash = chunkPosHash;

    const chunkPos = extractChunkPosFromHash(this.chunkPosHash);
    for (let x = 0; x < size; x++) {
      for (let z = 0; z < size; z++) {
          const worldX = x + chunkPos.x * world.info.CHUNK_SIZE;
          const worldZ = z + chunkPos.z * world.info.CHUNK_SIZE;
        const perlinHeight = Math.abs(
          world.getNoise().perlin2(worldX/100, worldZ/100)
            + world.getNoise().perlin2(worldX/80, worldZ/80)
            + world.getNoise().perlin2(worldX/30, worldZ/30)
        );
        const yHeight = Math.max(1, perlinHeight * height);
        for (let y = 0; y < yHeight; y++) {
          this.setBlock(world.info, x, y, z, 1);
        }
      }
    }
  }

  private isValidIndex(worldInfo: WorldInfo, x: number, y: number, z: number): boolean {
    return !(x < 0 || x >= worldInfo.CHUNK_SIZE
      || y < 0 || y >= worldInfo.CHUNK_HEIGHT
      || z < 0 || z >= worldInfo.CHUNK_SIZE);
  }

  private getIndex(worldInfo: WorldInfo, x: number, y: number, z: number): number {
    return x + (z * worldInfo.CHUNK_SIZE) + (y * worldInfo.CHUNK_SIZE * worldInfo.CHUNK_SIZE);
  }

  public getBlock(worldInfo: WorldInfo, x: number, y: number, z: number): number {
    if (!this.isValidIndex(worldInfo, x, y, z)) {
      return 0; // 超出邊界視為空氣 (未來這裡要向相鄰的 Chunk 查詢)
    }
    return this.blocks[this.getIndex(worldInfo, x, y, z)] as number;
  }

  public setBlock(worldInfo: WorldInfo, x: number, y: number, z: number, id: number) {
    if (this.isValidIndex(worldInfo, x, y, z)) {
      this.blocks[this.getIndex(worldInfo, x, y, z)] = id;
      this.needRedraw = true;
    }
  }

  public getChunkPosHash() { return this.chunkPosHash; }
  public getChunkModel() { return this.chunkModel; }
  public getNeedRedraw() { return this.needRedraw; }

  public update(gl: WebGL2RenderingContext, world: World) {
    const SHOW_WIREFRAME = false;
    if (this.needRedraw) {
      this.chunkMesh = ChunkMeshBuilder.build(this, world);
      this.chunkModel = new Model(gl, this.chunkMesh, SHOW_WIREFRAME);
      this.needRedraw = false;
    }
  }

  public unload(gl: WebGL2RenderingContext) {
    if (this.chunkModel) this.chunkModel.dispose(gl);
  }
}
