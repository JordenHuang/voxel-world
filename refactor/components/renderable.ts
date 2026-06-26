export interface Renderable {
  vao: WebGLVertexArrayObject; // 頂點陣列物件
  indicesCount: number;        // 要畫幾個頂點 (例如畫一個方塊是 36 個頂點)
  // shader: Shader;           // (可選) 如果你有不同的 Shader，可以記在這裡
}
