import { mat4, vec3, vec4 } from "gl-matrix";
import { Player } from "./player";
import { InputManager } from "./input-manager";
import { Renderer } from "./renderer";
import { Shader } from "./shader";
import vsSource from "./shaders/cube.vert?raw";
import fsSource from "./shaders/cube.frag?raw";


export class Game {
  private canvas: HTMLCanvasElement;
  private _gl: WebGLRenderingContext;
  private inputManager: InputManager;
  private player: Player;
  private renderer: Renderer;
  private shader: Shader;
  // private world: World; // 未來的 Chunk 管理器
  private isPaused: boolean = false;

  constructor() {
    this.canvas = document.getElementById("game-canvas") as HTMLCanvasElement;
    if (this.canvas === null) {
      throw new Error("Unable to locate canvas element.");
    }

    this._gl = this.canvas.getContext("webgl") as WebGLRenderingContext;
  if (this._gl === null) {
      throw new Error("Unable to initialize WebGL. Your browser or machine may not support it.");
  }

    // 初始化子系統
    this.inputManager = new InputManager(this.canvas);
    this.player = new Player(this._gl.canvas.width / this._gl.canvas.height);
    this.renderer = new Renderer(this._gl);
    this.shader = new Shader(this._gl, vsSource, fsSource);
    // this.world = new World();
  }

  // 協調各個子系統更新
  private update(deltaTime: number) {
    if (this.isPaused) return;

    // 1. 讀取輸入，並傳遞給 Player 去處理移動
    this.player.update(deltaTime, this.inputManager);

    // 2. 更新世界狀態（例如哪些 Chunk 需要加載）
    // this.world.update(this.player.position);

    // 3. 後續處理：清空滑鼠單次點擊狀態
    this.inputManager.clearFrameData();
  }

  // TODO: rename `buffers`
  private render(buffers: any, texture: WebGLTexture) {
    this._gl.clear(this._gl.COLOR_BUFFER_BIT | this._gl.DEPTH_BUFFER_BIT);
    // 呼叫渲染器畫出世界...
    this.renderer.draw(this.shader, buffers, this.player.camera.getViewMatrix(), this.player.camera.getProjectionMatrix(), texture);
  }

  private lastTimestamp = 0;
  private gameLoop(timestamp: number, buffers: any, texture: WebGLTexture) {
    const deltaTime = (timestamp - this.lastTimestamp); // In millisecond
    this.lastTimestamp = timestamp;

    this.update(deltaTime);
    this.render(buffers, texture);

    requestAnimationFrame((timestamp) => this.gameLoop(timestamp, buffers, texture));
  }

  // Entry point
  public start(buffers: any, texture: WebGLTexture) {
    const bgColor = vec4.fromValues(
      135 / 255,
      206 / 255,
      235 / 255,
      255 / 255
    );

    this._gl.clearColor(bgColor[0], bgColor[1], bgColor[2], bgColor[3]);
    this._gl.clear(this._gl.COLOR_BUFFER_BIT);

    requestAnimationFrame((timestamp) => this.gameLoop(timestamp, buffers, texture));
  }

  get gl() { return this._gl };
}
