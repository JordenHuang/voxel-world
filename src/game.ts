import { mat4, vec3, vec4 } from "gl-matrix";
import { Player } from "./player";
import { InputManager } from "./input-manager";
import { Renderer } from "./renderer";
import { Shader } from "./shader";
import { World } from "./meshes/world";
import { Model } from "./meshes/model";
import vsSource from "./shaders/cube.vert?raw";
import fsSource from "./shaders/cube.frag?raw";


export class Game {
  private canvas: HTMLCanvasElement;
  private gl: WebGLRenderingContext;
  private inputManager: InputManager;
  private player: Player;
  private renderer: Renderer;
  private shader: Shader;
  private world: World; // 未來的 Chunk 管理器
  private isPaused: boolean = false;

  constructor() {
    this.canvas = document.getElementById("game-canvas") as HTMLCanvasElement;
    if (this.canvas === null) {
      throw new Error("Unable to locate canvas element.");
    }

    this.gl = this.canvas.getContext("webgl") as WebGLRenderingContext;
    if (this.gl === null) {
      throw new Error("Unable to initialize WebGL. Your browser or machine may not support it.");
    }

    // 初始化子系統
    this.inputManager = new InputManager(this.canvas);
    this.player = new Player(this.gl.canvas.width / this.gl.canvas.height);
    this.renderer = new Renderer(this.gl);
    this.shader = new Shader(this.gl, vsSource, fsSource);
    this.world = new World(0, this.player.position);
  }

  // 協調各個子系統更新
  private update(deltaTime: number) {
    if (this.isPaused) return;

    // 1. 讀取輸入，並傳遞給 Player 去處理移動
    this.player.update(deltaTime, this.inputManager);

    // 2. 更新世界狀態（例如哪些 Chunk 需要加載）
    this.world.update(this.gl, this.player.position);

    // 3. 後續處理：清空滑鼠單次點擊狀態
    this.inputManager.clearFrameData();
  }

  // TODO: rename `buffers`
  private render(buffers: any, texture: WebGLTexture) {
    this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
    // 呼叫渲染器畫出世界...
    // this.renderer.draw(this.shader, buffers, this.player.camera.getViewMatrix(), this.player.camera.getProjectionMatrix(), texture);

    for (const chunk of this.world.getChunks().values()) {
      this.renderer.draw(this.shader, chunk.getChunkModel() as Model, this.player.camera.getViewMatrix(), this.player.camera.getProjectionMatrix(), texture);
    }
  }

  private lastTimestamp = 0;
  private gameLoop(timestamp: number, buffers: any, texture: WebGLTexture) {
    const deltaTime = (timestamp - this.lastTimestamp); // In millisecond
    this.lastTimestamp = timestamp;

    this.update(deltaTime);

    this.render(buffers, texture);

    const fpsLabel = document.getElementById("fps-label") as HTMLCanvasElement;
    fpsLabel.innerText = `FPS: ${Math.round(1/deltaTime*1000)}`;

    requestAnimationFrame((timestamp) => this.gameLoop(timestamp, null, texture));
  }

  // Entry point
  public start(buffers: any, texture: WebGLTexture) {
    const bgColor = vec4.fromValues(
      135 / 255,
      206 / 255,
      235 / 255,
      255 / 255
    );

    this.gl.clearColor(bgColor[0], bgColor[1], bgColor[2], bgColor[3]);
    this.gl.clear(this.gl.COLOR_BUFFER_BIT);

    requestAnimationFrame((timestamp) => this.gameLoop(timestamp, buffers, texture));
  }

  public getGl() { return this.gl };
}
