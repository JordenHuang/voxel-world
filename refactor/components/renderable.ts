import { Shader } from "../shader";

export interface Renderable {
  vao: WebGLVertexArrayObject | null;
  vertexCount: number;
  shader: Shader;
  buffers: {
    positions: WebGLBuffer;
    indices: WebGLBuffer;
    uvs: WebGLBuffer;
    aos: WebGLBuffer;
  } | null;
}
