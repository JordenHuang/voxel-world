import { vec3 } from "gl-matrix";
import { ECS } from "./ecs";
import type { ChunkPos, ChunkPosHash } from "./types/chunk";
import type {
  Rotation,
  WorldInfo,
  WorldData,
  ChunkData,
  DirtyFlag,
  Renderable,
} from "./components";
import type { Entity } from "./entities";
import { Shader } from "./shader";
import type { Mesh } from "./types/mesh";

export interface DirectionVectors {
  front: vec3;
  right: vec3;
  up: vec3;
}

export function getDirectionVectors(rot: Rotation): DirectionVectors {
  const front = vec3.create();
  // 1. 利用三角函數算出前方 (Front) 向量
  // 這裡的公式對應你之前在 CameraSystem 寫的數學邏輯
  front[0] = Math.cos(rot.yaw);
  front[1] = 0
  front[2] = Math.sin(rot.yaw);
  vec3.normalize(front, front);

  // 2. 利用外積 (Cross Product) 算出右方 (Right) 向量
  // 前方向量 (Front) 與 世界正上方 (0, 1, 0) 做外積，就會得到右方
  const right = vec3.create();
  const worldUp = vec3.fromValues(0, 1, 0);
  vec3.cross(right, front, worldUp);
  vec3.normalize(right, right);

  // 3. 再次利用外積算出真實的上方 (Up) 向量
  // 右方向量 (Right) 與 前方向量 (Front) 做外積，就會得到相對於該實體頭頂的上方
  const up = vec3.create();
  vec3.cross(up, right, front);
  vec3.normalize(up, up);

  return { front, right, up };
}

export function calculateChunkPosHash(chunkPos: ChunkPos): string {
  return `${chunkPos.x},${chunkPos.z}`;
}

export function extractChunkPosFromHash(hash: ChunkPosHash): ChunkPos {
  const items = hash.split(',');
  return {x: Number(items[0]), z: Number(items[1])};
}

export function chunkGetIndex(worldInfo: WorldInfo, x: number, y: number, z: number): number {
  return x + (z * worldInfo.CHUNK_SIZE) + (y * worldInfo.CHUNK_SIZE * worldInfo.CHUNK_SIZE);
}

export function chunkIsValidIndex(worldInfo: WorldInfo, x: number, y: number, z: number): boolean {
  return !(x < 0 || x >= worldInfo.CHUNK_SIZE
    || y < 0 || y >= worldInfo.CHUNK_HEIGHT
    || z < 0 || z >= worldInfo.CHUNK_SIZE);
}

export function chunkGetBlock(chunkData: ChunkData, worldInfo: WorldInfo, x: number, y: number, z: number): number {
    if (!chunkIsValidIndex(worldInfo, x, y, z)) {
      return 0; // 超出邊界視為空氣 (未來這裡要向相鄰的 Chunk 查詢)
    }
    return chunkData.blocks[chunkGetIndex(worldInfo, x, y, z)] as number;
  }

// TODO: Remove
export function chunkSetBlock(chunkData: ChunkData, dirtyFlag: DirtyFlag, worldInfo: WorldInfo, x: number, y: number, z: number, id: number) {
  if (chunkIsValidIndex(worldInfo, x, y, z)) {
    chunkData.blocks[chunkGetIndex(worldInfo, x, y, z)] = id;
    dirtyFlag.isDirty = true;
  }
}

export function isAirBlock(id: number): boolean {
  return id === 0;
}


export function worldGetChunk(worldData: WorldData, chunkPosHash: ChunkPosHash): Entity | undefined {
  return worldData.chunks.get(chunkPosHash);
}

export function worldGetBlock(ecs: ECS, worldInfo: WorldInfo, worldData: WorldData, worldX: number, worldY: number, worldZ: number): number {
  if (worldY < 0 || worldY >= worldInfo.CHUNK_HEIGHT) return 0;

  const chunkX = Math.floor(worldX / worldInfo.CHUNK_SIZE);
  const chunkZ = Math.floor(worldZ / worldInfo.CHUNK_SIZE);

  const chunkPos = calculateChunkPosHash({x: chunkX, z:  chunkZ});
  const chunk = worldGetChunk(worldData, chunkPos);
  if (!chunk) return 0; // Chunk 未載入視為空氣

  const neighborChunkData = ecs.getComponent(chunk, "ChunkData");
  if (!neighborChunkData) return 0;

  const localX = worldX - (chunkX * worldInfo.CHUNK_SIZE);
  const localZ = worldZ - (chunkZ * worldInfo.CHUNK_SIZE);

  return chunkGetBlock(neighborChunkData, worldInfo, localX, worldY, localZ);
}

export function worldSetBlockAndUpdateMesh(
  ecs: ECS,
  worldEntity: Entity,
  worldX: number,
  worldY: number,
  worldZ: number,
  blockId: number
) {
  const worldInfo = ecs.getComponent(worldEntity, "WorldInfo")!;
  const worldData = ecs.getComponent(worldEntity, "WorldData")!;

  // 1. 計算對應的 Chunk 座標與 Local 座標
  const chunkX = Math.floor(worldX / worldInfo.CHUNK_SIZE);
  const chunkZ = Math.floor(worldZ / worldInfo.CHUNK_SIZE);
  const localX = worldX - (chunkX * worldInfo.CHUNK_SIZE);
  const localZ = worldZ - (chunkZ * worldInfo.CHUNK_SIZE);

  // 2. 獲取並更新主要的 Chunk
  const hash = calculateChunkPosHash({ x: chunkX, z: chunkZ });
  const mainChunkEntity = worldGetChunk(worldData, hash);

  if (mainChunkEntity !== undefined) {
    // 更新方塊資料
    const chunkData = ecs.getComponent(mainChunkEntity, "ChunkData")!;
    chunkData.blocks[chunkGetIndex(worldInfo, localX, worldY, localZ)] = blockId;

    // 標記當前 Chunk 需要重新生成網格
    ecs.attachComponent(mainChunkEntity, "DirtyFlag", { isDirty: true });
  }

  // 3. 邊界擴散檢查 (Boundary Propagation)
  // 如果更動的方塊貼齊邊界，強制標記相鄰的 Chunk 也一併更新
  if (localX === 0) markNeighborDirty(ecs, worldData, chunkX - 1, chunkZ);
  if (localX === worldInfo.CHUNK_SIZE - 1) markNeighborDirty(ecs, worldData, chunkX + 1, chunkZ);
  if (localZ === 0) markNeighborDirty(ecs, worldData, chunkX, chunkZ - 1);
  if (localZ === worldInfo.CHUNK_SIZE - 1) markNeighborDirty(ecs, worldData, chunkX, chunkZ + 1);
  // (如果你的架構有 Y 軸的 Chunk 分割，這裡也要加上對應的檢查)
}

function markNeighborDirty(ecs: ECS, worldData: WorldData, chunkX: number, chunkZ: number) {
  const hash = calculateChunkPosHash({ x: chunkX, z: chunkZ });
  const neighborEntity = worldGetChunk(worldData, hash);
  if (neighborEntity !== undefined) {
    // 只要為相鄰 Chunk 貼上標籤，下一幀的 System 就會自動處理它
    ecs.attachComponent(neighborEntity, "DirtyFlag", { isDirty: true });
  }
}


// Function for generating VAO 
export function generateVAO(gl: WebGL2RenderingContext, shader: Shader, mesh: Mesh, genWireframe: boolean = false): [
vao: WebGLVertexArrayObject,
vertrexCount: number,
buffers: {
  positions: WebGLBuffer,
  indices: WebGLBuffer,
  uvs: WebGLBuffer,
  aos: WebGLBuffer
}] {
  let vao: WebGLVertexArrayObject;

  let vertexCount: number;
  let positionsBuffer: WebGLBuffer;
  let indicesBuffer: WebGLBuffer;
  let uvsBuffer: WebGLBuffer;
  let aosBuffer: WebGLBuffer;

  let wireframeVertexCount: number;
  let wireframeBuffer: WebGLBuffer;
  let wireframeIndices: number[];

  vao = gl.createVertexArray();
  gl.bindVertexArray(vao);

  vertexCount = mesh.indices.length;

  positionsBuffer = gl.createBuffer() as WebGLBuffer;
  gl.bindBuffer(gl.ARRAY_BUFFER, positionsBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(mesh.positions), gl.STATIC_DRAW);
  gl.vertexAttribPointer(shader.attributes["aVertexPosition"] as GLint, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(shader.attributes["aVertexPosition"] as GLint);

  indicesBuffer = gl.createBuffer() as WebGLBuffer;
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indicesBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(mesh.indices), gl.STATIC_DRAW);

  uvsBuffer = gl.createBuffer() as WebGLBuffer;
  gl.bindBuffer(gl.ARRAY_BUFFER, uvsBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(mesh.uvs), gl.STATIC_DRAW);
  gl.vertexAttribPointer(shader.attributes["aTextureCoord"] as GLint, 2, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(shader.attributes["aTextureCoord"] as GLint);

  aosBuffer = gl.createBuffer() as WebGLBuffer;
  gl.bindBuffer(gl.ARRAY_BUFFER, aosBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(mesh.aos), gl.STATIC_DRAW);
  gl.vertexAttribPointer(shader.attributes["aAO"] as GLint, 1, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(shader.attributes["aAO"] as GLint);

  if (genWireframe === true) {
    let wireframeIndices: number[] = [];
    for (let i = 0; i < mesh.indices.length; i += 3) {
      const a = mesh.indices[i + 0] as number;
      const b = mesh.indices[i + 1] as number;
      const c = mesh.indices[i + 2] as number;

      wireframeIndices.push(
        a, b,
        b, c,
        c, a
      );
    }
    wireframeVertexCount = wireframeIndices.length;
    wireframeBuffer = gl.createBuffer() as WebGLBuffer;
    wireframeIndices = wireframeIndices;
    // gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.wireframeBuffer);
    // gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(wireframeIndices), gl.STATIC_DRAW);
  }

  gl.bindVertexArray(null);
  return [
    vao, vertexCount,
    {
      positions: positionsBuffer,
      indices: indicesBuffer,
      uvs: uvsBuffer,
      aos: aosBuffer,
    }
  ];
}

export function disposeRenderable(gl: WebGL2RenderingContext, renderable: Renderable) {
  if (!renderable.vao || !renderable.buffers) return;

  // 清理所有的 Buffers
  gl.deleteBuffer(renderable.buffers.positions);
  gl.deleteBuffer(renderable.buffers.indices);
  gl.deleteBuffer(renderable.buffers.uvs);
  gl.deleteBuffer(renderable.buffers.aos);

  // 清理 VAO
  gl.deleteVertexArray(renderable.vao);

  // 將參照設為 null，幫助 JS 垃圾回收機制 (GC)
  renderable.vao = null;
  renderable.buffers = null;
  renderable.vertexCount = 0;
}
