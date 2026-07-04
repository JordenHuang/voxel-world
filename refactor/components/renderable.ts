import { Shader } from "../shader";
import type { RenderableBuffers } from "../types/renderable";

export interface Renderable {
  vao: WebGLVertexArrayObject | null;
  vertexCount: number;
  shader: Shader | null;
  buffers: RenderableBuffers | null;
}
