import { mat4, vec3, vec4 } from "gl-matrix";
import vsSource from "./cube.vs?raw";
import fsSource from "./cube.fs?raw";
// import { initShaderProgram } from "./shader.js";
import { initBuffers } from "./init-buffers.js";
// import { drawScene } from "./draw-scene.js";
import { Camera } from "./camera";
import { Player } from "./player";
import { InputManager } from "./input-manager";
import { Renderer } from "./renderer";
import { Shader } from "./shader";

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
  const canvas = document.getElementById("game-canvas") as HTMLCanvasElement;
  if (canvas === null) {
    alert("Unable to locate canvas element.");
    return;
  }

  const gl = canvas.getContext("webgl") as WebGLRenderingContext;
  if (gl === null) {
    alert("Unable to initialize WebGL. Your browser or machine may not support it.");
    return;
  }

  const bgColor = vec4.fromValues(
    135 / 255,
    206 / 255,
    235 / 255,
    255 / 255
  );

  gl.clearColor(bgColor[0], bgColor[1], bgColor[2], bgColor[3]);
  gl.clear(gl.COLOR_BUFFER_BIT);

  let shader = new Shader(gl, vsSource, fsSource);

  // Here's where we call the routine that builds all the
  // objects we'll be drawing.
  const buffers = initBuffers(gl);

  let player = new Player(gl.canvas.width / gl.canvas.height);
  let input = new InputManager(canvas);
  let renderer = new Renderer(gl);

  // Draw the scene
  // let camera = new Camera(gl.canvas.width / gl.canvas.height);
  // drawScene(gl, programInfo, buffers, cubeRotation, player.camera.getViewMatrix());

  // let texture = loadTexture(gl, "./assets/news.jpg");
  let texture = loadTexture(gl, "./assets/placeholder.png");
  renderer.draw(shader, buffers, player.camera.getViewMatrix(), player.camera.getProjectionMatrix(), texture);

  let previousTimestamp = 0;
  let deltaTime = 0;

  // Draw the scene repeatedly
  function gameLoop(timestamp: number) {
    deltaTime = timestamp - previousTimestamp;
    previousTimestamp = timestamp;
    // console.log(deltaTime);

    player.update(deltaTime, input);

    // updateCamera(verticalAngle, horizontalAngle, position);
    // drawScene(gl, programInfo, buffers, cubeRotation, player.camera.getViewMatrix());
  renderer.draw(shader, buffers, player.camera.getViewMatrix(), player.camera.getProjectionMatrix(), texture);

    // cubeRotation += deltaTime * 0.001; // convert deltaTime to seconds
    // console.log(...position);

    input.clearFrameData();
    requestAnimationFrame(gameLoop);
  }

  requestAnimationFrame(gameLoop);
})();

