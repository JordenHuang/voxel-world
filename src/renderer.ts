import { mat4 } from "gl-matrix";
import { Shader } from "./shader";

export class Renderer {
  private gl: WebGLRenderingContext;

  private modelMatrix: mat4 = mat4.create();
  private modelViewMatrix: mat4 = mat4.create();

  constructor(gl: WebGLRenderingContext) {
    this.gl = gl;
    this.gl.clearDepth(1.0); // Clear everything
    this.gl.enable(this.gl.DEPTH_TEST); // Enable depth testing
    this.gl.depthFunc(this.gl.LEQUAL); // Near things obscure far things
  }

  // 這裡的 texture 就是我們剛剛 loadTexture 回傳的東西
  public draw(shader: Shader, buffers: any, viewMatrix: mat4, projectionMatrix: mat4, texture: WebGLTexture) {
    const gl = this.gl;

    // Clear the canvas before we start drawing on it.
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // 2. 計算模型矩陣
    mat4.identity(this.modelMatrix); // 每次重置為單位矩陣
    // Now move the drawing position a bit to where we want to
    // start drawing the square.
    mat4.translate(
      this.modelMatrix, // destination matrix
      this.modelMatrix, // matrix to translate
      [-0.0, 0.0, -6.0],
    ); // amount to translate

    // 3. 矩陣相乘 (利用預先分配的 modelViewMatrix 來接收結果，達成 Zero Allocation)
    mat4.mul(this.modelViewMatrix, viewMatrix, this.modelMatrix);

    // 4. 綁定著色器與變數
    gl.useProgram(shader.program);
    gl.uniformMatrix4fv(shader.uniforms["uProjectionMatrix"] as WebGLUniformLocation, false, projectionMatrix);
    gl.uniformMatrix4fv(shader.uniforms["uModelViewMatrix"] as WebGLUniformLocation, false, this.modelViewMatrix);

    // 5. 綁定頂點、紋理座標、與實體紋理
    this.bindBuffers(buffers, shader);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.uniform1i(shader.uniforms["uSampler"] as WebGLUniformLocation, 0); // 告訴 Shader 圖片在 TEXTURE0

    // 6. 繪製
    const drawWireframe = false; // 設定一個開關來方便你除錯

    if (drawWireframe) {
      // 綁定線框專用的 Buffer
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.wireframeIndices);
      gl.drawElements(gl.LINES, 60, gl.UNSIGNED_SHORT, 0);
    } else {
      // 原本畫實體方塊的邏輯
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.indices);
      gl.drawElements(gl.TRIANGLES, 36, gl.UNSIGNED_SHORT, 0);
    }
  }

  private bindBuffers(buffers: any, shader: Shader) {
    const gl = this.gl;

    // 1. 綁定 Position (把方塊的形狀傳給 GPU)
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position);
    gl.vertexAttribPointer(
      shader.attributes["aVertexPosition"] as GLint,
      3, // 每次取 3 個數字 (x, y, z)
      gl.FLOAT,
      false,
      0,
      0
    );
    gl.enableVertexAttribArray(
      shader.attributes["aVertexPosition"] as GLint,
    );

    // 2. 綁定 Texture Coord (把圖片的 UV 座標傳給 GPU)
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.texture);
    gl.vertexAttribPointer(
      shader.attributes["aTextureCoord"] as GLint, 
      2, // 每次取 2 個數字 (u, v)
      gl.FLOAT, 
      false, 
      0, 
      0
    );
    gl.enableVertexAttribArray(
      shader.attributes["aTextureCoord"] as GLint, 
    );
  }
}

