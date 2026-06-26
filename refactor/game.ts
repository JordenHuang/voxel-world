import { vec4 } from "gl-matrix";

import { ECS } from "./ecs";
import { EventBus } from "./event-bus";

import type { Entity } from "./entities/";
import type { System } from "./systems/";
import * as Entities from "./entities/";
import * as Systems from "./systems/";

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
  private playerControlSystem: Systems.PlayerControlSystem;
  private cameraSystem: Systems.CameraSystem;
  private inputSystem: Systems.InputSystem;
  private renderSystem: Systems.RenderSystem;
  private targetFollowerSystem: Systems.TargetFollowerSystem;

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
    this.camera = Entities.createCamera(this.ecs, { targetEntityId: this.player, isMainCamera: true} as Entities.CameraOptions);

    this.playerControlSystem = new Systems.PlayerControlSystem(this.ecs, this.eventBus);
    this.cameraSystem = new Systems.CameraSystem(this.ecs, this.eventBus);
    this.inputSystem = new Systems.InputSystem(this.ecs, this.eventBus);
    this.renderSystem = new Systems.RenderSystem(this.ecs, this.eventBus, this.canvas, this.gl);
    this.targetFollowerSystem = new Systems.TargetFollowerSystem(this.ecs);
  }

  private lastTimestamp = 0;
  private gameLoop(timestamp: number, texture: WebGLTexture) {
    const deltaTime = (timestamp - this.lastTimestamp); // In millisecond
    this.lastTimestamp = timestamp;

    this.inputSystem.update(deltaTime);
    this.playerControlSystem.update(deltaTime);
    this.targetFollowerSystem.update(deltaTime);
    this.cameraSystem.update(deltaTime);
    this.renderSystem.update(deltaTime);

    this.inputSystem.clearFrameData();

    // ==============================


    const player = this.ecs.queryFirst("PlayerTag", "Position", "Rotation");
    if (player) {
      const pos = this.ecs.getComponent(player, "Position")!;
      console.log(pos.x, pos.y, pos.z);
    }

    // ==============================

    const fpsLabel = document.getElementById("fps-label") as HTMLCanvasElement;
    fpsLabel.innerText = `FPS: ${Math.round(1/deltaTime*1000)}`;

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
