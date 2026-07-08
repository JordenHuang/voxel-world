import type { RenderPass } from "./render-pass";
import { ECS } from "../ecs";
import { Shader } from "../shader";
import { ChunkUtils } from "../utils";

export class ChunkRenderPass implements RenderPass {
  private gl: WebGL2RenderingContext;
  private shader: Shader;
  private texture: WebGLTexture;

  constructor(gl: WebGL2RenderingContext, shader: Shader, texture: WebGLTexture) {
    this.gl = gl;
    this.shader = shader;
    this.texture = texture;
  }

  public execute(ecs: ECS): void {
    const gl = this.gl;

    gl.enable(gl.DEPTH_TEST);
    // this.gl.enable(this.gl.CULL_FACE);

    gl.useProgram(this.shader.program);

    // Get visible chunks
    const visibleChunks = ecs.query("Renderable", "ChunkTag", "ChunkData", "VisibleInFrustumTag");
    for (const chunk of visibleChunks) {
      const chunkData = ecs.getComponent(chunk, "ChunkData")!;
      const chunkWorldPos = ChunkUtils.extractChunkPosFromHash(chunkData.chunkPosHash);
      const worldInfo = ecs.getComponent(chunkData.worldId, "WorldInfo")!;

      gl.uniform3fv(this.shader.uniforms["uChunkWorldPos"] as WebGLUniformLocation, [
        chunkWorldPos.x * worldInfo.CHUNK_SIZE,
        0,
        chunkWorldPos.z * worldInfo.CHUNK_SIZE
      ]);

      const renderable = ecs.getComponent(chunk, "Renderable")!;

      // Bind texture
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, this.texture);
      gl.uniform1i(this.shader.uniforms["uSampler"] as WebGLUniformLocation, 0);

      // console.log(mesh.vertexCount);
      gl.bindVertexArray(renderable.vao);
      gl.drawElements(gl.TRIANGLES, renderable.vertexCount, gl.UNSIGNED_SHORT, 0);
    }
  }
}
