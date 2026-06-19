import type { Mesh } from "./mesh";
import type { Shader } from "../shader";

/* Turn mesh, texture data into WebGL buffer, and used by Renderer */
export class Model {
  public readonly vao: WebGLVertexArrayObject;

  public readonly vertexCount: number;
  public readonly positionsBuffer: WebGLBuffer;
  public readonly indicesBuffer: WebGLBuffer;
  public readonly uvsBuffer: WebGLBuffer;

  public readonly wireframeVertexCount?: number;
  public readonly wireframeBuffer?: WebGLBuffer;

  constructor(gl: WebGL2RenderingContext, shader: Shader, mesh: Mesh, genWireframe: boolean = false) {
    this.vao = gl.createVertexArray();
    gl.bindVertexArray(this.vao);

    this.vertexCount = mesh.indices.length;

    this.positionsBuffer = gl.createBuffer() as WebGLBuffer;
    gl.bindBuffer(gl.ARRAY_BUFFER, this.positionsBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(mesh.positions), gl.STATIC_DRAW);
    gl.vertexAttribPointer(shader.attributes["aVertexPosition"] as GLint, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(shader.attributes["aVertexPosition"] as GLint);

    this.indicesBuffer = gl.createBuffer() as WebGLBuffer;
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indicesBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(mesh.indices), gl.STATIC_DRAW);

    this.uvsBuffer = gl.createBuffer() as WebGLBuffer;
    gl.bindBuffer(gl.ARRAY_BUFFER, this.uvsBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(mesh.uvs), gl.STATIC_DRAW);
    gl.vertexAttribPointer(shader.attributes["aTextureCoord"] as GLint, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(shader.attributes["aTextureCoord"] as GLint);

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
      this.wireframeVertexCount = wireframeIndices.length;
      this.wireframeBuffer = gl.createBuffer() as WebGLBuffer;
      // gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.wireframeBuffer);
      // gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(wireframeIndices), gl.STATIC_DRAW);

      gl.bindVertexArray(null);
    }
  }

  public dispose(gl: WebGL2RenderingContext) {
    if (this.positionsBuffer) gl.deleteBuffer(this.positionsBuffer);
    if (this.indicesBuffer) gl.deleteBuffer(this.indicesBuffer);
    if (this.uvsBuffer) gl.deleteBuffer(this.uvsBuffer);
    if (this.wireframeBuffer) gl.deleteBuffer(this.wireframeBuffer);
    // if (this.colorBuffer) gl.deleteBuffer(this.colorBuffer);

    // if (this.vao) {
    // gl.deleteVertexArray(this.vao); 
    // }
  }
}

