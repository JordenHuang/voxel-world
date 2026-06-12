import type { Mesh } from "./mesh";

export class Model {
  public readonly vertexCount: number;
  public readonly positionsBuffer: WebGLBuffer;
  public readonly indicesBuffer: WebGLBuffer;
  public readonly uvsBuffer: WebGLBuffer;

  public readonly wireframeVertexCount?: number;
  public readonly wireframeBuffer?: WebGLBuffer;

  constructor(gl: WebGLRenderingContext, mesh: Mesh, genWireframe: boolean = false) {
    this.vertexCount = mesh.indices.length;

    this.positionsBuffer = gl.createBuffer() as WebGLBuffer;
    gl.bindBuffer(gl.ARRAY_BUFFER, this.positionsBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(mesh.positions), gl.STATIC_DRAW);

    this.indicesBuffer = gl.createBuffer() as WebGLBuffer;
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indicesBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(mesh.indices), gl.STATIC_DRAW);

    this.uvsBuffer = gl.createBuffer() as WebGLBuffer;
    gl.bindBuffer(gl.ARRAY_BUFFER, this.uvsBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(mesh.uvs), gl.STATIC_DRAW);

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
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.wireframeBuffer);
      gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(wireframeIndices), gl.STATIC_DRAW);
    }
  }
}

  // private verticesBuffer: WebGLBuffer | null = null;
  // private indicesBuffer: WebGLBuffer | null = null;
  // private textureCoordinatesBuffer: WebGLBuffer | null = null;
  // private wireframeIndicesBuffer: WebGLBuffer | null = null;


/*
export class Mesh {
  public readonly vertexCount: number;
  public readonly wireframeVertexCount: number;

  public readonly verticesBuffer: WebGLBuffer;
  public readonly indicesBuffer: WebGLBuffer;
  public readonly textureCoordinatesBuffer: WebGLBuffer;
  public readonly wireframeIndicesBuffer: WebGLBuffer | null = null;

  // 建構子強迫一次性給齊資源，消除 Temporal Coupling
  constructor(gl: WebGLRenderingContext, geometry: GeometryData) {
    this.vertexCount = geometry.indices.length;

    // 1. 建立並寫入 Vertices
    this.verticesBuffer = gl.createBuffer() as WebGLBuffer;
    gl.bindBuffer(gl.ARRAY_BUFFER, this.verticesBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(geometry.vertices), gl.STATIC_DRAW);

    // 2. 建立並寫入 Texture Coordinates
    this.textureCoordinatesBuffer = gl.createBuffer() as WebGLBuffer;
    gl.bindBuffer(gl.ARRAY_BUFFER, this.textureCoordinatesBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(geometry.textureCoordinates), gl.STATIC_DRAW);

    // 3. 建立並寫入 Indices
    this.indicesBuffer = gl.createBuffer() as WebGLBuffer;
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indicesBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(geometry.indices), gl.STATIC_DRAW);

    // 4. 動態計算或寫入 Wireframe Indices
    const wireframeData = geometry.wireframeIndices ?? this.generateWireframe(geometry.indices);
    this.wireframeVertexCount = wireframeData.length;
    this.wireframeIndicesBuffer = gl.createBuffer() as WebGLBuffer;
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.wireframeIndicesBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(wireframeData), gl.STATIC_DRAW);
  }

  // 將原本的邏輯封裝為私有方法
  private generateWireframe(indices: number[]): number[] {
    const wireframe: number[] = [];
    for (let i = 0; i < indices.length; i += 3) {
      wireframe.push(
        indices[i], indices[i + 1],
        indices[i + 1], indices[i + 2],
        indices[i + 2], indices[i]
      );
    }
    return wireframe;
  }
}
*/
