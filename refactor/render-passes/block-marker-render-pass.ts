import type { RenderPass } from "./render-pass";
import { ECS } from "../ecs";
import { Shader } from "../shader";
import {
  ChunkUtils,
  WorldUtils,
  RenderableUtils,
  RaycastUtils,
} from "../utils";

import { ChunkMeshBuilder } from "../systems";

export class BlockMarkerRenderPass implements RenderPass {
  private gl: WebGL2RenderingContext;
  private shader: Shader;
  private vao: WebGLVertexArrayObject;
  private vertexCount: number;

  constructor(gl: WebGL2RenderingContext, shader: Shader) {
    this.gl = gl;
    this.shader = shader;

    const vertices: number[] = [];
    const indices: number[] = [];
    let vertexCounter = 0;

    for (const face of ChunkMeshBuilder.BLOCK_MESH.faces) {
      // Generate vertices
      for (let i = 0; i < 4; i++) { // 4 corners
        let chunkLocalPackedData = 0;
        chunkLocalPackedData |= (face.offset[i*3 + 0]! << 23);
        chunkLocalPackedData |= (face.offset[i*3 + 1]! << 14);
        chunkLocalPackedData |= (face.offset[i*3 + 2]! <<  5);
        vertices.push(chunkLocalPackedData);
      }

      indices.push(
        vertexCounter + 0, vertexCounter + 1, vertexCounter + 2,
        vertexCounter + 0, vertexCounter + 2, vertexCounter + 3
      );

      vertexCounter += 4;
    }

    const mesh = {
      positions: vertices,
      indices: indices,
      uvs: null,
    };
    [this.vao, this.vertexCount] = RenderableUtils.generateVAO(this.gl, mesh, false);
  }

  private getRayResult(ecs: ECS) {
    // Player
    const player = ecs.queryFirst("MainPlayerTag", "PlayerData");
    if (!player) return;

    const playerData = ecs.getComponent(player, "PlayerData")!;

    // Camera
    const camera = ecs.queryFirst("MainCameraTag", "CameraData", "Position");
    if (!camera) return;

    // getBlockFn
    const camPos = ecs.getComponent(camera, "Position")!;
    const camData = ecs.getComponent(camera, "CameraData")!;

    const worldInfo = ecs.getComponent(playerData.worldId, "WorldInfo")!;
    const worldData = ecs.getComponent(playerData.worldId, "WorldData")!;
    const getBlockFn = (x: number, y: number, z: number): number => {
      return WorldUtils.worldGetBlock(ecs, worldInfo, worldData, x, y, z);
    };

    return RaycastUtils.Raycast.cast(
      camPos.value,
      camData.front,
      5.0,
      getBlockFn
    );
  }

  public execute(ecs: ECS): void {
    const gl = this.gl;

    // const rayResult = this.getRayResult(ecs);

    // Player
    const player = ecs.queryFirst("MainPlayerTag", "PlayerData");
    if (!player) return;

    const playerLookAt = ecs.getComponent(player, "PlayerLookAt");
    if (!playerLookAt) return;

    const rayResult = playerLookAt.rayResult;

    gl.useProgram(this.shader.program);

    gl.uniform1f(this.shader.uniforms["uTime"] as WebGLUniformLocation, performance.now()*0.001);

    if (rayResult && rayResult.hitPos) {
      gl.uniform3fv(this.shader.uniforms["uChunkWorldPos"] as WebGLUniformLocation, [
        rayResult.hitPos[0],
        rayResult.hitPos[1],
        rayResult.hitPos[2]
      ]);

      gl.bindVertexArray(this.vao);
      gl.drawElements(gl.TRIANGLES, this.vertexCount, gl.UNSIGNED_SHORT, 0);
      gl.bindVertexArray(null);
    }
  }
}
