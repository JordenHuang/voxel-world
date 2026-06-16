import type { Mesh } from "./mesh";
import { World } from "./world";
import { Chunk, type ChunkPos, type ChunkPosHash, extractChunkPosFromHash } from "./chunk";
import { CubeMesh } from "./cube-mesh"; // TODO: Remove it

export class ChunkMeshBuilder {
  public static readonly BLOCK_MESH = {
    faces: [
      { name: 'front',  dir: [ 0,  0,  1], offset: [1,0,1, 1,1,1, 0,1,1, 0,0,1] },
      { name: 'back',   dir: [ 0,  0, -1], offset: [0,0,0, 0,1,0, 1,1,0, 1,0,0] },
      { name: 'top',    dir: [ 0,  1,  0], offset: [1,1,1, 1,1,0, 0,1,0, 0,1,1] },
      { name: 'bottom', dir: [ 0, -1,  0], offset: [1,0,0, 1,0,1, 0,0,1, 0,0,0] },
      { name: 'right',  dir: [ 1,  0,  0], offset: [1,0,0, 1,1,0, 1,1,1, 1,0,1] },
      { name: 'left',   dir: [-1,  0,  0], offset: [0,0,1, 0,1,1, 0,1,0, 0,0,0] },
    ],
    uv: [1.0, 0.0, 1.0, 1.0, 0.0, 1.0, 0.0, 0.0],
  };

  public static build(chunk: Chunk, world: World): Mesh {
    const vertices: number[] = [];
    const indices: number[] = [];
    const uvs: number[] = [];
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
                x + face.dir[0]!,
                y + face.dir[1]!,
                z + face.dir[2]!
              );

              // Neighbor is not air, means this face is invisible from player, so no need to render this face
              if (neighborId !== 0) {
                continue;
              }

              const chunkNeighborId = world.getBlock(
                worldX+face.dir[0]!,
                worldY+face.dir[1]!,
                worldZ+face.dir[2]!
              );

              // If neighbor block in neighbor chunk is also air, means this face is visible from player, render it
              if (chunkNeighborId === 0) {
                zeroCount++;
                // Generate vertices
                for (let i = 0; i < face.offset.length; i += 3) {
                  vertices.push(
                    worldX + face.offset[i+0]!,
                    worldY + face.offset[i+1]!,
                    worldZ + face.offset[i+2]!
                  );
                }

                uvs.push(...this.BLOCK_MESH.uv);
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
    }

    return {
      positions: vertices,
      indices: indices,
      uvs: uvs
    };
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
