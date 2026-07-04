import { Shader } from "../shader";
import type { Mesh } from "../types/mesh";
import type { RenderableBuffers } from "../types/renderable";
import type {
  Renderable,
} from "../components";

// Function for generating VAO
export function generateVAO(gl: WebGL2RenderingContext, shader: Shader, mesh: Mesh, genWireframe: boolean = false): [
vao: WebGLVertexArrayObject,
vertrexCount: number,
buffers: RenderableBuffers
] {
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
