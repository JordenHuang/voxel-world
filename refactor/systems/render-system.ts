import { mat4 } from "gl-matrix";
import { ECS } from "../ecs";
import { EventBus } from "../event-bus";
import type { System } from "./index";
import { Shader } from "../shader";
import vsSource from "../shaders/cube.vert?raw";
import fsSource from "../shaders/cube.frag?raw";

type UniformSetter = (gl: WebGL2RenderingContext, shader: Shader) => void;

export class RenderSystem implements System {
  private ecs: ECS;
  private eventBus: EventBus;

  private canvas: HTMLCanvasElement;
  private gl: WebGL2RenderingContext;
  private shader: Shader;

  private modelMatrix: mat4 = mat4.create();
  private modelViewMatrix: mat4 = mat4.create();
  private texture: WebGLTexture;

  private setCustomUniforms?: UniformSetter;

  constructor(ecs: ECS, eventBus: EventBus, canvas: HTMLCanvasElement, gl: WebGL2RenderingContext, shader: Shader, texture: WebGLTexture, setCustomUniforms?: UniformSetter) {
    this.ecs = ecs;
    this.eventBus = eventBus;

    this.canvas = canvas;
    this.gl = gl;
    // this.shader = new Shader(this.gl, vsSource, fsSource);
    this.shader = shader; // TODO: Should use Renderable's shader field

    this.texture = texture;

    if (setCustomUniforms)
      this.setCustomUniforms = setCustomUniforms;

    this.gl.clearDepth(1.0); // Clear everything
    this.gl.enable(this.gl.DEPTH_TEST); // Enable depth testing
    this.gl.depthFunc(this.gl.LEQUAL); // Near things obscure far things

    // // TODO: Enable this
    // gl.enable(gl.CULL_FACE); // Back face culling
    // gl.cullFace(gl.BACK);

    this.setupEventListeners();
    // this.setupSubscriptions();
  }

  public isCanvasHasPointerLocked(canvas: HTMLCanvasElement): boolean {
    return document.pointerLockElement === canvas;
  }
  public isCanvasFullScreen(canvas: HTMLCanvasElement): boolean {
    return document.fullscreenElement === canvas;
  }

  // private setupSubscriptions() {
  // }

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
      }
      else {
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

    const mainCamera = this.ecs.queryFirst("MainCameraTag");
    if (!mainCamera) {
      console.log("[Render system] Nothing to draw");
      return;
    }

    const camData = this.ecs.getComponent(mainCamera, "CameraData")!;

    // Calculate model matrix
    mat4.identity(this.modelMatrix);
    mat4.mul(this.modelViewMatrix, camData.viewMatrix, this.modelMatrix);

    // Bind shader and variables
    gl.useProgram(this.shader.program);
    gl.uniformMatrix4fv(this.shader.uniforms["uProjectionMatrix"] as WebGLUniformLocation, false, camData.projectionMatrix);
    gl.uniformMatrix4fv(this.shader.uniforms["uModelViewMatrix"] as WebGLUniformLocation, false, this.modelViewMatrix);

    if (this.setCustomUniforms) {
      this.setCustomUniforms(gl, this.shader);
    }

    // Bind texture
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.texture);
    gl.uniform1i(this.shader.uniforms["uSampler"] as WebGLUniformLocation, 0);

    const renderables = this.ecs.query("Renderable");
    for (const entity of renderables) {
      const mesh = this.ecs.getComponent(entity, "Renderable")!;
      // console.log(mesh.vertexCount);
      gl.bindVertexArray(mesh.vao);
      gl.drawElements(gl.TRIANGLES, mesh.vertexCount, gl.UNSIGNED_SHORT, 0);
    }
  }
}
