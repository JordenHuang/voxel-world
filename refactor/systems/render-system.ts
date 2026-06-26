import { ECS } from "../ecs";
import { EventBus } from "../event-bus";
import type { System } from "./index";
import { Shader } from "../shader";
import vsSource from "../shaders/cube.vert?raw";
import fsSource from "../shaders/cube.frag?raw";

export class RenderSystem implements System {
  private ecs: ECS;
  private eventBus: EventBus;

  private canvas: HTMLCanvasElement;
  private gl: WebGL2RenderingContext;
  private shader: Shader;

  constructor(ecs: ECS, eventBus: EventBus, canvas: HTMLCanvasElement, gl: WebGL2RenderingContext) {
    this.ecs = ecs;
    this.eventBus = eventBus;

    this.canvas = canvas;
    this.gl = gl;
    this.shader = new Shader(this.gl, vsSource, fsSource);

    this.gl.clearDepth(1.0); // Clear everything
    this.gl.enable(this.gl.DEPTH_TEST); // Enable depth testing
    this.gl.depthFunc(this.gl.LEQUAL); // Near things obscure far things

    // // TODO: Enable this
    // gl.enable(gl.CULL_FACE); // Back face culling
    // gl.cullFace(gl.BACK);

    this.setupSubscriptions();
  }

  private setupSubscriptions() {
    this.eventBus.on("ENTER_FULLSCREEN", async (data) => {
      try {
        if (!data.isFullScreen)
          await this.canvas.requestFullscreen();
        if (!data.isPointerLocked)
          await this.canvas.requestPointerLock();
      } catch (error) {
        console.error("Unable to enter fullscreen mode:", error);
      }
    });

    const defaultCanvasWidth = this.canvas.width;
    const defaultCanvasHeight = this.canvas.height;

    this.eventBus.on("WINDOW_RESIZED", (data) => {
      if (data.mode === "default") {
        this.gl.canvas.width = defaultCanvasWidth;
        this.gl.canvas.height = defaultCanvasHeight;
      }
      else if (data.mode === "fullscreen") {
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

  public update(deltaTime: number) {
    const gl = this.gl;

    gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);

    const mainCamera = this.ecs.queryFirst("CameraData");

    // // Bind shader and variables
    // gl.useProgram(this.shader.program);
    //
    // if (mainCamera) {
    //   const camData = this.ecs.getComponent(mainCamera, "CameraData")!;
    //   gl.uniformMatrix4fv(this.shader.uniforms["uProjectionMatrix"] as WebGLUniformLocation, false, camData.projectionMatrix);
    //   gl.uniformMatrix4fv(this.shader.uniforms["uViewMatrix"] as WebGLUniformLocation, false, camData.viewMatrix);
    // }
    //
    // gl.activeTexture(gl.TEXTURE0);
    // gl.bindTexture(gl.TEXTURE_2D, texture);
    // gl.uniform1i(this.shader.uniforms["uSampler"] as WebGLUniformLocation, 0); // 告訴 Shader 圖片在 TEXTURE0
  }
}
