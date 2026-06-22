export interface Mesh {
  positions: number[]; // Vertices
  indices: number[];
  uvs: number[]; // Texture coordinates
  aos: number[]; // Ambient occlusion
}
