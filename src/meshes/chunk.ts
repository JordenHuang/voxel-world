import type { Mesh } from "./mesh";
import { CubeMesh } from "./cube-mesh";

export class Chunk {
  public static readonly SIZE = 16;
  public static readonly HEIGHT = 256;
  
  // 0 = 空氣, 1 = 實體方塊
  private blocks: Uint8Array;

  constructor() {
    const volume = Chunk.SIZE * Chunk.HEIGHT * Chunk.SIZE;
    this.blocks = new Uint8Array(volume);

    // 測試：生成一個簡單的地板
    for (let x = 0; x < Chunk.SIZE; x++) {
      for (let z = 0; z < Chunk.SIZE; z++) {
        for (let y = 0; y < 3; y++) {
          this.setBlock(x, y, z, 1);
        }
      }
    }
  }

  private getIndex(x: number, y: number, z: number): number {
    return x + (z * Chunk.SIZE) + (y * Chunk.SIZE * Chunk.SIZE);
  }

  public getBlock(x: number, y: number, z: number): number {
    if (x < 0 || x >= Chunk.SIZE || y < 0 || y >= Chunk.HEIGHT || z < 0 || z >= Chunk.SIZE) {
      return 0; // 超出邊界視為空氣 (未來這裡要向相鄰的 Chunk 查詢)
    }
    return this.blocks[this.getIndex(x, y, z)] as number;
  }

  public setBlock(x: number, y: number, z: number, id: number) {
    if (x >= 0 && x < Chunk.SIZE && y >= 0 && y < Chunk.HEIGHT && z >= 0 && z < Chunk.SIZE) {
      this.blocks[this.getIndex(x, y, z)] = id;
    }
  }

public generateMesh(): Mesh {
    const vertices: number[] = [];
    const indices: number[] = [];
    const uvs: number[] = [];
    let vertexCounter = 0;
    const NO_FACE_CULLING: boolean = false;

    // 走訪 Chunk 內的每一個方塊
    for (let y = 0; y < Chunk.HEIGHT; y++) {
      for (let z = 0; z < Chunk.SIZE; z++) {
        for (let x = 0; x < Chunk.SIZE; x++) {

          if (this.getBlock(x, y, z) === 0) continue;

          if (NO_FACE_CULLING) {
            const vertexOffset = vertices.length / 3;

            // 2. 推入加上空間位移的頂點座標
            for (let i = 0; i < CubeMesh.positions.length; i += 3) {
              vertices.push(CubeMesh.positions[i]! + x);
              vertices.push(CubeMesh.positions[i+1]! + y);
              vertices.push(CubeMesh.positions[i+2]! + z);
            }

            // 3. 推入 UV 座標
            uvs.push(...CubeMesh.uvs);

            // 🌟 4. 推入索引，並加上剛剛記錄好的偏移量
            // 這裡直接一個一個推入即可，不需要 i += 3，因為我們就是要遍歷所有的索引
            for (let i = 0; i < CubeMesh.indices.length; i++) {
              indices.push(CubeMesh.indices[i]! + vertexOffset);
            }
          } else {
            // Front
            if (this.getBlock(x, y, z+1) == 0) { // If neighbor is air
              vertices.push(
                x+1, y+0, z+1,
                x+1, y+1, z+1,
                x+0, y+1, z+1,
                x+0, y+0, z+1,
              );
              uvs.push(1,0, 1,1, 0,1, 0,0);
              indices.push(
                vertexCounter + 0, vertexCounter + 1, vertexCounter + 2,
                vertexCounter + 0, vertexCounter + 2, vertexCounter + 3
              );
              vertexCounter += 4;
            }
            // Back
            if (this.getBlock(x, y, z-1) == 0) {
              vertices.push(
                x+0, y+0, z+0,
                x+0, y+1, z+0,
                x+1, y+1, z+0,
                x+1, y+0, z+0,
              );
              uvs.push(1,0, 1,1, 0,1, 0,0);
              indices.push(
                vertexCounter + 0, vertexCounter + 1, vertexCounter + 2,
                vertexCounter + 0, vertexCounter + 2, vertexCounter + 3
              );
              vertexCounter += 4;
            }
            // Top
            if (this.getBlock(x, y+1, z) == 0) {
              vertices.push(
                x+1, y+1, z+1,
                x+1, y+1, z+0,
                x+0, y+1, z+0,
                x+0, y+1, z+1,
              );
              uvs.push(1,0, 1,1, 0,1, 0,0);
              indices.push(
                vertexCounter + 0, vertexCounter + 1, vertexCounter + 2,
                vertexCounter + 0, vertexCounter + 2, vertexCounter + 3
              );
              vertexCounter += 4;
            }
            // Bottom
            if (this.getBlock(x, y-1, z) == 0) {
              vertices.push(
                x+1, y+0, z+0,
                x+1, y+0, z+1,
                x+0, y+0, z+1,
                x+0, y+0, z+0,
              );
              uvs.push(1,0, 1,1, 0,1, 0,0);
              indices.push(
                vertexCounter + 0, vertexCounter + 1, vertexCounter + 2,
                vertexCounter + 0, vertexCounter + 2, vertexCounter + 3
              );
              vertexCounter += 4;
            }
            // Right
            if (this.getBlock(x+1, y, z) == 0) {
              vertices.push(
                x+1, y+0, z+0,
                x+1, y+1, z+0,
                x+1, y+1, z+1,
                x+1, y+0, z+1,
              );
              uvs.push(1,0, 1,1, 0,1, 0,0);
              indices.push(
                vertexCounter + 0, vertexCounter + 1, vertexCounter + 2,
                vertexCounter + 0, vertexCounter + 2, vertexCounter + 3
              );
              vertexCounter += 4;
            }
            // Left
            if (this.getBlock(x-1, y, z) == 0) {
              vertices.push(
                x+0, y+0, z+1,
                x+0, y+1, z+1,
                x+0, y+1, z+0,
                x+0, y+0, z+0,
              );
              uvs.push(1,0, 1,1, 0,1, 0,0);
              indices.push(
                vertexCounter + 0, vertexCounter + 1, vertexCounter + 2,
                vertexCounter + 0, vertexCounter + 2, vertexCounter + 3
              );
              vertexCounter += 4;
            }

          }
        }
      }
    }

    return {
      positions: vertices,
      indices: indices,
      uvs: uvs
    };
  }
}
