import { vec4, vec3 } from "gl-matrix";

import { ECS } from "./ecs";
import { EventBus } from "./event-bus";

import type { Entity } from "./entities/";
import type { System } from "./systems/";
import * as Entities from "./entities/";
import * as Components from "./components/";
import * as Systems from "./systems/";

import { Shader } from "./shader";
import vsSource from "./shaders/cube.vert?raw";
import fsSource from "./shaders/cube.frag?raw";

import { SlidingFpsAverage } from "./fps";

function loadTexture(gl: WebGL2RenderingContext, url: string): WebGLTexture {
  const texture = gl.createTexture() as WebGLTexture;
  gl.bindTexture(gl.TEXTURE_2D, texture);

  // 1. 先塞入一個 1x1 的藍色像素作為佔位符 (Placeholder)
  const pixel = new Uint8Array([0, 0, 255, 255]);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, pixel);

  // 2. 建立 Image 物件開始非同步載入
  const image = new Image();
  image.crossOrigin = "anonymous";
  image.onload = () => {
    // gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
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

export class Game {
  private canvas: HTMLCanvasElement;
  private gl: WebGL2RenderingContext;

  private ecs: ECS;
  private eventBus: EventBus;

  private camera: Entity;
  private player: Entity;
  private world: Entity;

  private playerControlSystem: Systems.PlayerControlSystem;
  private cameraSystem: Systems.CameraSystem;
  private inputSystem: Systems.InputSystem;
  private renderSystem: Systems.RenderSystem;
  private targetFollowerSystem: Systems.TargetFollowerSystem;

  private worldSystem: Systems.WorldSystem;
  private chunkBuilder: Systems.ChunkBuilder;
  private chunkMeshBuilder: Systems.ChunkMeshBuilder;

  private fpsAverage = new SlidingFpsAverage(10);

  constructor() {
    this.canvas = document.getElementById("game-canvas") as HTMLCanvasElement;
    if (this.canvas === null) {
      throw new Error("Unable to locate canvas element.");
    }

    this.gl = this.canvas.getContext("webgl2") as WebGL2RenderingContext;
    if (this.gl === null) {
      throw new Error("Unable to initialize WebGL. Your browser or machine may not support it.");
    }

    this.ecs = new ECS();
    this.eventBus = new EventBus();

    this.player = Entities.createPlayer(this.ecs);
    this.camera = Entities.createCamera(this.ecs, {
      aspectRatio: this.canvas.width / this.canvas.height,
      targetEntityId: this.player,
      isMainCamera: true,
    } as Entities.CameraOptions);

    const seed = 0;
    const worldInfo = {
      CHUNK_HEIGHT: 32,
      CHUNK_SIZE: 16,
      RENDER_DISTANCE: 8,
      // CHUNK_HEIGHT: 16,
      // CHUNK_SIZE: 1,
      // RENDER_DISTANCE: 8,
    } as Components.WorldInfo;
    this.world = Entities.createWorld(this.ecs, worldInfo, seed);

    let shader = new Shader(this.gl, vsSource, fsSource);
    let texture = loadTexture(this.gl, "./assets/frame.png");

    const setCustomUniforms = (gl: WebGL2RenderingContext, shader: Shader) => {
      gl.uniform1f(shader.uniforms["uChunkHeight"] as WebGLUniformLocation, worldInfo.CHUNK_HEIGHT);
      // gl.uniform1f(shader.uniforms["uTime"] as WebGLUniformLocation, this.player.position[0] * this.player.position[2]);
    }

    this.playerControlSystem = new Systems.PlayerControlSystem(this.ecs, this.eventBus);
    this.cameraSystem = new Systems.CameraSystem(this.ecs, this.eventBus);
    this.inputSystem = new Systems.InputSystem(this.ecs, this.eventBus);
    this.renderSystem = new Systems.RenderSystem(this.ecs, this.eventBus, this.canvas, this.gl, shader, texture, setCustomUniforms);
    this.targetFollowerSystem = new Systems.TargetFollowerSystem(this.ecs);

    this.worldSystem = new Systems.WorldSystem(this.ecs, this.eventBus, this.gl, shader);
    this.chunkBuilder = new Systems.ChunkBuilder(this.ecs, this.eventBus);
    this.chunkMeshBuilder = new Systems.ChunkMeshBuilder(this.ecs, this.eventBus, this.gl);
  }

  private lastTimestamp = 0;
  private gameLoop(timestamp: number, texture: WebGLTexture) {
    const deltaTime = (timestamp - this.lastTimestamp); // In millisecond
    this.lastTimestamp = timestamp;

    this.inputSystem.update(deltaTime);
    this.playerControlSystem.update(deltaTime);
    this.targetFollowerSystem.update(deltaTime);
    this.cameraSystem.update(deltaTime);

    this.worldSystem.update(deltaTime);
    this.chunkBuilder.update(deltaTime);
    this.chunkMeshBuilder.update(deltaTime);

    this.renderSystem.update(deltaTime);

    this.inputSystem.clearFrameData();

    // ==============================


    // const player = this.ecs.queryFirst("PlayerTag", "Position", "Rotation");
    // const mainCamera = this.ecs.queryFirst("MainCameraTag");
    // if (player && mainCamera) {
    //   const playPosition = this.ecs.getComponent(player, "Position")!;
    //   const camPosition = this.ecs.getComponent(mainCamera, "Position")!;
    //   console.log(...playPosition, vec3.equals(playPosition, camPosition));
    // }

    // ==============================

    const fpsLabel = document.getElementById("fps-label") as HTMLCanvasElement;
    const fps = Math.round(1/deltaTime*1000);
    this.fpsAverage.add(fps);
    fpsLabel.innerText = `FPS: ${this.fpsAverage.getAverage()}`;

    requestAnimationFrame((timestamp) => this.gameLoop(timestamp, texture));
  }

  public start() {
    let texture = loadTexture(this.gl, "./assets/frame.png");
    const bgColor = vec4.fromValues(
      135 / 255,
      206 / 255,
      235 / 255,
      255 / 255
    );

    this.gl.clearColor(bgColor[0], bgColor[1], bgColor[2], bgColor[3]);
    this.gl.clear(this.gl.COLOR_BUFFER_BIT);
    requestAnimationFrame((timestamp) => this.gameLoop(timestamp, texture));
  }
}
