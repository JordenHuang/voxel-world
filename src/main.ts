// import { initBuffers } from "./init-buffers.js";
import { Game } from "./game";
import { CubeMesh } from "./meshes/cube-mesh";
import { Model } from "./meshes/model";
import { Chunk } from "./meshes/chunk";

let cubeRotation = 0.0;

function loadTexture(gl: WebGLRenderingContext, url: string): WebGLTexture {
  const texture = gl.createTexture() as WebGLTexture;
  gl.bindTexture(gl.TEXTURE_2D, texture);

  // 1. 先塞入一個 1x1 的藍色像素作為佔位符 (Placeholder)
  const pixel = new Uint8Array([0, 0, 255, 255]);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, pixel);

  // 2. 建立 Image 物件開始非同步載入
  const image = new Image();
  image.crossOrigin = "anonymous";
  image.onload = () => {
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);

    const isPowerOf2 = (value: number) => (value & (value - 1)) === 0;

    // 檢查圖片長寬是否都是 2 的次方
    if (isPowerOf2(image.width) && isPowerOf2(image.height)) {
      // ✅ 是 POT：開啟 Mipmap
      gl.generateMipmap(gl.TEXTURE_2D);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    } else {
      // ❌ 不是 POT：關閉 Mipmap，並強制設定邊緣處理方式
      // 警告：WebGL1 規定非 POT 圖片不能使用 REPEAT (重複平鋪) 功能
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST); // 縮小用 Nearest
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST); // 放大用 Nearest
    }
  };
  image.src = url;

  return texture;
}

// main function (using IIFE, Immediately Invoked Function Expression)
(function main() {
  const game = new Game();

  // Here's where we call the routine that builds all the
  // objects we'll be drawing.
  // const buffers = initBuffers(game.gl);
  let texture = loadTexture(game.gl, "./assets/placeholder.png");

  // let cubeModel = new Model(game.gl, CubeMesh, true);
  //
  const myChunk = new Chunk();
  const chunkMeshData = myChunk.generateMesh(); 
  const chunkGPUModel = new Model(game.gl, chunkMeshData, true);

  // game.start(buffers, texture);
  // game.start(cubeModel, texture);
  game.start(chunkGPUModel, texture);
})();

