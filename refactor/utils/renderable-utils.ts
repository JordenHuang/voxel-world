import type { Mesh } from "../types/mesh";
import type { RenderableBuffers } from "../types/renderable";
import type {
  Renderable,
} from "../components";

const ATTRIB_LOC_aChunkLocalPackedData = 0;
const ATTRIB_LOC_aTexturePackedData = 1;

// Function for generating VAO
export function generateVAO(gl: WebGL2RenderingContext, mesh: Mesh, genWireframe: boolean = false): [
vao: WebGLVertexArrayObject,
vertrexCount: number,
buffers: RenderableBuffers
] {
  let vao: WebGLVertexArrayObject;

  let vertexCount: number;
  let positionsBuffer: WebGLBuffer;
  let indicesBuffer: WebGLBuffer;
  let uvsBuffer: WebGLBuffer | null;

  let wireframeVertexCount: number;
  let wireframeBuffer: WebGLBuffer;
  let wireframeIndices: number[];

  vao = gl.createVertexArray();
  gl.bindVertexArray(vao);

  vertexCount = mesh.indices.length;

  positionsBuffer = gl.createBuffer() as WebGLBuffer;
  gl.bindBuffer(gl.ARRAY_BUFFER, positionsBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Uint32Array(mesh.positions), gl.STATIC_DRAW);
  gl.vertexAttribIPointer(ATTRIB_LOC_aChunkLocalPackedData , 1, gl.UNSIGNED_INT, 0, 0);
  gl.enableVertexAttribArray(ATTRIB_LOC_aChunkLocalPackedData);

  indicesBuffer = gl.createBuffer() as WebGLBuffer;
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indicesBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(mesh.indices), gl.STATIC_DRAW);

  if (mesh.uvs) {
    uvsBuffer = gl.createBuffer() as WebGLBuffer;
    gl.bindBuffer(gl.ARRAY_BUFFER, uvsBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(mesh.uvs), gl.STATIC_DRAW);
    gl.vertexAttribIPointer(ATTRIB_LOC_aTexturePackedData, 2, gl.UNSIGNED_INT, 0, 0);
    gl.enableVertexAttribArray(ATTRIB_LOC_aTexturePackedData);
  } else {
    uvsBuffer = null;
  }

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
    }
  ];
}

export function disposeRenderable(gl: WebGL2RenderingContext, renderable: Renderable) {
  if (!renderable.vao || !renderable.buffers) return;

  gl.deleteBuffer(renderable.buffers.positions);
  gl.deleteBuffer(renderable.buffers.indices);
  if (renderable.buffers.uvs) gl.deleteBuffer(renderable.buffers.uvs);

  gl.deleteVertexArray(renderable.vao);

  renderable.vao = null;
  renderable.buffers = null;
  renderable.vertexCount = 0;
}
