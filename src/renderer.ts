import { mat4 } from "gl-matrix";
import { Shader } from "./shader";
import { Model } from "./meshes/model";

type UniformSetter = (gl: WebGL2RenderingContext, shader: Shader) => void;

export class Renderer {
  private gl: WebGL2RenderingContext;

  private modelMatrix: mat4 = mat4.create();
  private modelViewMatrix: mat4 = mat4.create();

  constructor(gl: WebGL2RenderingContext) {
    this.gl = gl;
    this.gl.clearDepth(1.0); // Clear everything
    this.gl.enable(this.gl.DEPTH_TEST); // Enable depth testing
    this.gl.depthFunc(this.gl.LEQUAL); // Near things obscure far things

    // // TODO: Enable this
    // gl.enable(gl.CULL_FACE); // Back face culling
    // gl.cullFace(gl.BACK);
  }

  public draw(shader: Shader, model: Model, viewMatrix: mat4, projectionMatrix: mat4, texture: WebGLTexture, setCustomUniforms?: UniformSetter) {
    const gl = this.gl;

    // Calculate model matrix
    mat4.identity(this.modelMatrix); // 每次重置為單位矩陣
    // // Now move the drawing position a bit to where we want to
    // // start drawing the square.
    // mat4.translate(
    //   this.modelMatrix, // destination matrix
    //   this.modelMatrix, // matrix to translate
    //   [-0.0, 0.0, -6.0],
    // ); // amount to translate

    // Calculate model-view matrix
    mat4.mul(this.modelViewMatrix, viewMatrix, this.modelMatrix);

    // Bind shader and variables
    gl.useProgram(shader.program);
    gl.uniformMatrix4fv(shader.uniforms["uProjectionMatrix"] as WebGLUniformLocation, false, projectionMatrix);
    gl.uniformMatrix4fv(shader.uniforms["uModelViewMatrix"] as WebGLUniformLocation, false, this.modelViewMatrix);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.uniform1i(shader.uniforms["uSampler"] as WebGLUniformLocation, 0); // 告訴 Shader 圖片在 TEXTURE0

    if (setCustomUniforms) {
      setCustomUniforms(gl, shader);
    }

    gl.bindVertexArray(model.vao);

    // Render on screen
    const drawWireframe = false;

    if (drawWireframe && model.wireframeBuffer !== undefined) {
      gl.bindTexture(gl.TEXTURE_2D, null);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, model.wireframeBuffer);
      gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(model.wireframeIndices as number[]), gl.STATIC_DRAW);
      gl.drawElements(gl.LINES, model.wireframeVertexCount as number, gl.UNSIGNED_SHORT, 0);
    } else {
      gl.drawElements(gl.TRIANGLES, model.vertexCount, gl.UNSIGNED_SHORT, 0);
    }

    gl.bindVertexArray(null);
  }
}

