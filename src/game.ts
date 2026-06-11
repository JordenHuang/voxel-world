import { Player } from "./player";
import { InputManager } from "./input-manager";


export class Game {
  private canvas: HTMLCanvasElement;
  private gl: WebGLRenderingContext;
  private input: InputManager;
  private player: Player;
  // private world: World; // 未來的 Chunk 管理器
  private isPaused: boolean = false;

  constructor(canvasId: string) {
    this.canvas = document.getElementById(canvasId) as HTMLCanvasElement;
  if (this.canvas === null) {
    alert("Unable to locate canvas element.");
    return;
  }

    this.gl = this.canvas.getContext("webgl") as WebGLRenderingContext;
  if (this.gl === null) {
    alert("Unable to initialize WebGL. Your browser or machine may not support it.");
    return;
  }

    // 初始化子系統
    this.input = new InputManager(this.canvas);
    this.player = new Player(this.canvas.width / this.canvas.height);
    // this.world = new World();
  }

  // 協調各個子系統更新
  private update(deltaTime: number) {
    if (this.isPaused) return;

    // 1. 讀取輸入，並傳遞給 Player 去處理移動
    this.player.update(deltaTime, this.input);

    // 2. 更新世界狀態（例如哪些 Chunk 需要加載）
    // this.world.update(this.player.position);

    // 3. 後續處理：清空滑鼠單次點擊狀態
    this.input.clearFrameData();
  }

  private render() {
    this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
    // 呼叫渲染器畫出世界...
    // this.renderer.draw(this.world, this.player.camera);
  }

  private lastTime = 0;
  private gameLoop(now: number) {
    const deltaTime = (now - this.lastTime) / 1000;
    this.lastTime = now;

    this.update(deltaTime);
    this.render();

    requestAnimationFrame((time) => this.gameLoop(time));
  }

  // Entry point
  public start() {
    requestAnimationFrame((time) => this.gameLoop(time));
  }
}
