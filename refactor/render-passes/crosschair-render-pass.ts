import type { RenderPass } from "./render-pass";
import { ECS } from "../ecs";
import { Shader } from "../shader";

export class CrosschairRenderPass implements RenderPass {
  private gl: WebGL2RenderingContext;
  private shader: Shader;
  private vao: WebGLVertexArrayObject;

  constructor(gl: WebGL2RenderingContext, shader: Shader) {
    this.gl = gl;
    this.shader = shader;
    this.vao = gl.createVertexArray();
  }

  public execute(ecs: ECS): void {
    const gl = this.gl;

    gl.disable(gl.DEPTH_TEST);

    gl.useProgram(this.shader.program);
    gl.bindVertexArray(this.vao);

    gl.drawArrays(gl.POINTS, 0, 1);

    gl.enable(gl.DEPTH_TEST);
    gl.bindVertexArray(null);
  }
}
