import { vec4 } from "gl-matrix";
import { ECS } from "./ecs";
import { EventBus } from "./event-bus";
import type { RenderPass } from "./render-passes/render-pass"

export class GameRenderer {
  private eventBus: EventBus;

  private canvas: HTMLCanvasElement;
  private gl: WebGL2RenderingContext;
  private transformUBO!: WebGLBuffer;

  // Order matters
  private passes: RenderPass[] = [];

  constructor(eventBus: EventBus, canvas: HTMLCanvasElement, gl: WebGL2RenderingContext) {
    this.eventBus = eventBus;
    this.canvas = canvas;
    this.gl = gl;

    this.gl.clearDepth(1.0); // Clear everything
    this.gl.enable(this.gl.DEPTH_TEST); // Enable depth testing
    this.gl.depthFunc(this.gl.LEQUAL); // Near things obscure far things

    this.setupGlobalState();
    this.setupUBO();
    this.setupEventListeners();
  }

  private setupGlobalState() {
    const bgColor = vec4.fromValues(
      135 / 255,
      206 / 255,
      235 / 255,
      255 / 255
    );

    this.gl.clearColor(bgColor[0], bgColor[1], bgColor[2], bgColor[3]);
  }

  private setupUBO() {
    this.transformUBO = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.UNIFORM_BUFFER, this.transformUBO);
    this.gl.bufferData(this.gl.UNIFORM_BUFFER, 128, this.gl.DYNAMIC_DRAW);
    this.gl.bindBufferBase(this.gl.UNIFORM_BUFFER, 0, this.transformUBO);
    this.gl.bindBuffer(this.gl.UNIFORM_BUFFER, null);
  }

  private updateUBO(ecs: ECS) {
    const camera = ecs.queryFirst("MainCameraTag", "CameraData");
    if (!camera) return;

    const camData = ecs.getComponent(camera, "CameraData")!;
    const transformData = new Float32Array(32);
    transformData.set(camData.viewMatrix, 0);
    transformData.set(camData.projectionMatrix, 16);

    this.gl.bindBuffer(this.gl.UNIFORM_BUFFER, this.transformUBO);
    this.gl.bufferSubData(this.gl.UNIFORM_BUFFER, 0, transformData);
    this.gl.bindBuffer(this.gl.UNIFORM_BUFFER, null);
  }

  private setupEventListeners() {
    this.canvas.addEventListener("click", async () => {
      try {
        if (!this.isCanvasFullScreen(this.canvas))
          await this.canvas.requestFullscreen();
        if (!this.isCanvasHasPointerLocked(this.canvas))
          await this.canvas.requestPointerLock();
      } catch (error) {
        console.error("Unable to enter fullscreen mode:", error);
      }
    });

    const defaultCanvasWidth = this.canvas.width;
    const defaultCanvasHeight = this.canvas.height;

    window.addEventListener("resize", () => {
      if (!this.isCanvasFullScreen(this.canvas)) {
        this.gl.canvas.width = defaultCanvasWidth;
        this.gl.canvas.height = defaultCanvasHeight;
      } else {
        this.gl.canvas.width = window.innerWidth;
        this.gl.canvas.height = window.innerHeight;
      }

      this.gl.viewport(0, 0, this.gl.canvas.width, this.gl.canvas.height);

      this.eventBus.emit("UPDATE_ASPECT_RATIO", {
        width: this.gl.canvas.width,
        height: this.gl.canvas.height,
      });
    });
  }

  private isCanvasHasPointerLocked(canvas: HTMLCanvasElement): boolean {
    return document.pointerLockElement === canvas;
  }

  private isCanvasFullScreen(canvas: HTMLCanvasElement): boolean {
    return document.fullscreenElement === canvas;
  }

  public addPass(pass: RenderPass): void {
    this.passes.push(pass);
  }

  public draw(ecs: ECS): void {
    this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);

    this.updateUBO(ecs);

    for (const pass of this.passes) {
      pass.execute(ecs);
    }
  }
}
