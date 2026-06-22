import type { Mesh } from "./mesh";
import { World } from "./world";
import { Chunk, type ChunkPos, type ChunkPosHash, extractChunkPosFromHash } from "./chunk";
import { CubeMesh } from "./cube-mesh"; // TODO: Remove it
import { vec3 } from "gl-matrix";

type Face = {
  name: string,
  dir: [number, number, number],
  // [ upper-left, lower-left, lower-right, upper-right ]
  offset: number[],
  // Each face's uv axis (Like tangent space)
  u: [number, number, number],
  v: [number, number, number],
};

type UV = number;

type FaceVertexOffset = [number, number];

export class ChunkMeshBuilder {
  public static readonly BLOCK_MESH: {faces: Face[], uvs: UV[], faceVertexOffsets: [FaceVertexOffset, FaceVertexOffset, FaceVertexOffset, FaceVertexOffset]} = {
    faces: [
      { name: 'front',  dir: [ 0,  0,  1], offset: [0,1,1, 0,0,1, 1,0,1, 1,1,1], u: [ 1,  0,  0], v: [0,  1,  0] },
      { name: 'back',   dir: [ 0,  0, -1], offset: [1,1,0, 1,0,0, 0,0,0, 0,1,0], u: [-1,  0,  0], v: [0,  1,  0] },
      { name: 'top',    dir: [ 0,  1,  0], offset: [0,1,0, 0,1,1, 1,1,1, 1,1,0], u: [ 1,  0,  0], v: [0,  0, -1] },
      { name: 'bottom', dir: [ 0, -1,  0], offset: [0,0,1, 0,0,0, 1,0,0, 1,0,1], u: [ 1,  0,  0], v: [0,  0,  1] },
      { name: 'right',  dir: [ 1,  0,  0], offset: [1,1,1, 1,0,1, 1,0,0, 1,1,0], u: [ 0,  0, -1], v: [0,  1,  0] },
      { name: 'left',   dir: [-1,  0,  0], offset: [0,1,0, 0,0,0, 0,0,1, 0,1,1], u: [ 0,  0,  1], v: [0,  1,  0] },
    ],
    uvs: [0.0, 0.0,   0.0, 1.0,   1.0, 1.0,   1.0, 0.0],
    // [ upper-left, lower-left, lower-right, upper-right ]
    faceVertexOffsets: [[-1,  1], [-1, -1], [ 1, -1], [ 1,  1]],
  };

  public static build(chunk: Chunk, world: World): Mesh {
    const vertices: number[] = [];
    const indices: number[] = [];
    const uvs: number[] = [];
    const aos: number[] = [];  // Ambient occlusion
    let vertexCounter = 0;
    const NO_FACE_CULLING: boolean = false;
    let zeroCount = 0;

    // 走訪 Chunk 內的每一個方塊
    for (let y = 0; y < world.info.CHUNK_HEIGHT; y++) {
      for (let z = 0; z < world.info.CHUNK_SIZE; z++) {
        for (let x = 0; x < world.info.CHUNK_SIZE; x++) {
          if (chunk.getBlock(world.info, x, y, z) === 0) continue;

        const chunkPos = extractChunkPosFromHash(chunk.getChunkPosHash());
          const worldX = x + chunkPos.x * world.info.CHUNK_SIZE;
          const worldY = y;
          const worldZ = z + chunkPos.z * world.info.CHUNK_SIZE;

          if (NO_FACE_CULLING) {
            const vertexOffset = vertices.length / 3;

            // 2. 推入加上空間位移的頂點座標
            for (let i = 0; i < CubeMesh.positions.length; i += 3) {
              vertices.push(CubeMesh.positions[i+0]! + worldX);
              vertices.push(CubeMesh.positions[i+1]! + worldY);
              vertices.push(CubeMesh.positions[i+2]! + worldZ);
            }

            // 3. 推入 UV 座標
            uvs.push(...CubeMesh.uvs);

            // 🌟 4. 推入索引，並加上剛剛記錄好的偏移量
            // 這裡直接一個一個推入即可，不需要 i += 3，因為我們就是要遍歷所有的索引
            for (let i = 0; i < CubeMesh.indices.length; i++) {
              indices.push(CubeMesh.indices[i]! + vertexOffset);
            }
          } else {
            for (const face of this.BLOCK_MESH.faces) {
              const neighborId = chunk.getBlock(world.info,
                x + face.dir[0],
                y + face.dir[1],
                z + face.dir[2]
              );

              // Neighbor is not air, means this face is invisible from player, so no need to render this face
              if (!this.isAir(neighborId)) {
                continue;
              }

              const chunkNeighborId = world.getBlock(
                worldX+face.dir[0],
                worldY+face.dir[1],
                worldZ+face.dir[2]
              );

              // If neighbor block in neighbor chunk is also air, means this face is visible from player, render it
              if (this.isAir(chunkNeighborId)) {
                zeroCount++;
                // Generate vertices
                for (let i = 0; i < face.offset.length; i += 3) {
                  vertices.push(
                    worldX + face.offset[i+0]!,
                    worldY + face.offset[i+1]!,
                    worldZ + face.offset[i+2]!
                  );
                }

                const faceAOs = this.getAOs(world, face, worldX, worldY, worldZ);
                aos.push(...faceAOs);

                uvs.push(...this.BLOCK_MESH.uvs);

                // Quad Flip (https://0fps.net/2013/07/03/ambient-occlusion-for-minecraft-like-worlds/)
                if (faceAOs[0] + faceAOs[2] <= faceAOs[1] + faceAOs[3]) {
                  // 翻轉切割方向
                  indices.push(
                    vertexCounter + 0, vertexCounter + 1, vertexCounter + 3,
                    vertexCounter + 1, vertexCounter + 2, vertexCounter + 3
                  );
                } else {
                  indices.push(
                    vertexCounter + 0, vertexCounter + 1, vertexCounter + 2,
                    vertexCounter + 0, vertexCounter + 2, vertexCounter + 3
                  );
                }

                vertexCounter += 4;
              }
            }

          }
        }
      }
    }

    return {
      positions: vertices,
      indices: indices,
      uvs: uvs,
      aos: aos,  // Ambient occlusion
    };
  }

  private static vertexAmbientOcclusion(side1: boolean, side2: boolean, corner: boolean): number {
    if(side1 && side2) {
      return 0
    }
    const occluded = (side1 ? 1 : 0) + (side2 ? 1 : 0) + (corner ? 1 : 0);
    return 3 - occluded;
  }

  private static getAOs(world: World, face: Face, worldX: number, worldY: number, worldZ: number /* worldCoord: vec3 */): [number, number, number, number] {
    /* Look at each face from it's normal position
     * a b c
     * d _ e
     * f g h
     */
    worldX = worldX + face.dir[0];
    worldY = worldY + face.dir[1];
    worldZ = worldZ + face.dir[2];

    const aos: number[] = [];
    for (const [du, dv] of this.BLOCK_MESH.faceVertexOffsets) {
      // Side1, d or e
      const s1X = worldX + face.u[0] * du;
      const s1Y = worldY + face.u[1] * du;
      const s1Z = worldZ + face.u[2] * du;

      // Side2, b or g
      const s2X = worldX + face.v[0] * dv;
      const s2Y = worldY + face.v[1] * dv;
      const s2Z = worldZ + face.v[2] * dv;

      // Corner, a or c or h or f
      const cX = worldX + face.u[0] * du + face.v[0] * dv;
      const cY = worldY + face.u[1] * du + face.v[1] * dv;
      const cZ = worldZ + face.u[2] * du + face.v[2] * dv;

      const side1 = !this.isAir(world.getBlock(s1X, s1Y, s1Z));
      const side2 = !this.isAir(world.getBlock(s2X, s2Y, s2Z));
      const corner = !this.isAir(world.getBlock(cX, cY, cZ));

      const ao = this.vertexAmbientOcclusion(side1, side2, corner);
      aos.push(ao);
    }
    return aos as [number, number, number, number];
  }

  private static isAir(id: number): boolean {
    return id === 0;
  }
}


/* Face culling, leave it here as reference
```Typescript
// Front
if (chunk.getBlock(world.info, x, y, z+1) == 0) { // If neighbor is air
  vertices.push(
    worldX+1, y+0, worldZ+1,
    worldX+1, y+1, worldZ+1,
    worldX+0, y+1, worldZ+1,
    worldX+0, y+0, worldZ+1,
  );
  uvs.push(1,0, 1,1, 0,1, 0,0);
  indices.push(
    vertexCounter + 0, vertexCounter + 1, vertexCounter + 2,
    vertexCounter + 0, vertexCounter + 2, vertexCounter + 3
  );
  vertexCounter += 4;
}
// Back
if (chunk.getBlock(world.info, x, y, z-1) == 0) {
  vertices.push(
    worldX+0, y+0, worldZ+0,
    worldX+0, y+1, worldZ+0,
    worldX+1, y+1, worldZ+0,
    worldX+1, y+0, worldZ+0,
  );
  uvs.push(1,0, 1,1, 0,1, 0,0);
  indices.push(
    vertexCounter + 0, vertexCounter + 1, vertexCounter + 2,
    vertexCounter + 0, vertexCounter + 2, vertexCounter + 3
  );
  vertexCounter += 4;
}
// Top
if (chunk.getBlock(world.info, x, y+1, z) == 0) {
  vertices.push(
    worldX+1, y+1, worldZ+1,
    worldX+1, y+1, worldZ+0,
    worldX+0, y+1, worldZ+0,
    worldX+0, y+1, worldZ+1,
  );
  uvs.push(1,0, 1,1, 0,1, 0,0);
  indices.push(
    vertexCounter + 0, vertexCounter + 1, vertexCounter + 2,
    vertexCounter + 0, vertexCounter + 2, vertexCounter + 3
  );
  vertexCounter += 4;
}
// Bottom
if (chunk.getBlock(world.info, x, y-1, z) == 0) {
  vertices.push(
    worldX+1, y+0, worldZ+0,
    worldX+1, y+0, worldZ+1,
    worldX+0, y+0, worldZ+1,
    worldX+0, y+0, worldZ+0,
  );
  uvs.push(1,0, 1,1, 0,1, 0,0);
  indices.push(
    vertexCounter + 0, vertexCounter + 1, vertexCounter + 2,
    vertexCounter + 0, vertexCounter + 2, vertexCounter + 3
  );
  vertexCounter += 4;
}
// Right
if (chunk.getBlock(world.info, x+1, y, z) == 0) {
  vertices.push(
    worldX+1, y+0, worldZ+0,
    worldX+1, y+1, worldZ+0,
    worldX+1, y+1, worldZ+1,
    worldX+1, y+0, worldZ+1,
  );
  uvs.push(1,0, 1,1, 0,1, 0,0);
  indices.push(
    vertexCounter + 0, vertexCounter + 1, vertexCounter + 2,
    vertexCounter + 0, vertexCounter + 2, vertexCounter + 3
  );
  vertexCounter += 4;
}
// Left
if (chunk.getBlock(world.info, x-1, y, z) == 0) {
  vertices.push(
    worldX+0, y+0, worldZ+1,
    worldX+0, y+1, worldZ+1,
    worldX+0, y+1, worldZ+0,
    worldX+0, y+0, worldZ+0,
  );
  uvs.push(1,0, 1,1, 0,1, 0,0);
  indices.push(
    vertexCounter + 0, vertexCounter + 1, vertexCounter + 2,
    vertexCounter + 0, vertexCounter + 2, vertexCounter + 3
  );
  vertexCounter += 4;
}
```
*/
