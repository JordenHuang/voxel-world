// import { mat4 } from "gl-matrix";
// import { ECS } from "./ecs";
// import { EventBus } from "./event-bus";
// import { Shader } from "./shader";
// import {
//   ChunkUtils,
// } from "./utils/";
//
// type UniformSetter = (gl: WebGL2RenderingContext, shader: Shader) => void;
//
// export class RenderSystem {
//   private eventBus: EventBus;
//
//   private canvas: HTMLCanvasElement;
//   private gl: WebGL2RenderingContext;
//
//   private texture: WebGLTexture;
//
//   private setCustomUniforms?: UniformSetter;
//
//   constructor(eventBus: EventBus, canvas: HTMLCanvasElement, gl: WebGL2RenderingContext, texture: WebGLTexture, setCustomUniforms?: UniformSetter) {
//     this.eventBus = eventBus;
//
//     this.canvas = canvas;
//     this.gl = gl;
//
//     this.texture = texture;
//
//     if (setCustomUniforms)
//       this.setCustomUniforms = setCustomUniforms;
//
//     this.gl.clearDepth(1.0); // Clear everything
//     this.gl.enable(this.gl.DEPTH_TEST); // Enable depth testing
//     this.gl.depthFunc(this.gl.LEQUAL); // Near things obscure far things
//
//     // // TODO: Enable this
//     // gl.enable(gl.CULL_FACE); // Back face culling
//     // gl.cullFace(gl.BACK);
//
//     this.setupEventListeners();
//   }
//
//   private setupEventListeners() {
//     this.canvas.addEventListener("click", async () => {
//       try {
//         if (!this.isCanvasFullScreen(this.canvas))
//           await this.canvas.requestFullscreen();
//         if (!this.isCanvasHasPointerLocked(this.canvas))
//           await this.canvas.requestPointerLock();
//       } catch (error) {
//         console.error("Unable to enter fullscreen mode:", error);
//       }
//     });
//
//     const defaultCanvasWidth = this.canvas.width;
//     const defaultCanvasHeight = this.canvas.height;
//
//     window.addEventListener("resize", () => {
//       if (!this.isCanvasFullScreen(this.canvas)) {
//         this.gl.canvas.width = defaultCanvasWidth;
//         this.gl.canvas.height = defaultCanvasHeight;
//       } else {
//         this.gl.canvas.width = window.innerWidth;
//         this.gl.canvas.height = window.innerHeight;
//       }
//
//       this.gl.viewport(0, 0, this.gl.canvas.width, this.gl.canvas.height);
//
//       this.eventBus.emit("UPDATE_ASPECT_RATIO", {
//         width: this.gl.canvas.width,
//         height: this.gl.canvas.height,
//       });
//     });
//   }
//
//   public isCanvasHasPointerLocked(canvas: HTMLCanvasElement): boolean {
//     return document.pointerLockElement === canvas;
//   }
//
//   public isCanvasFullScreen(canvas: HTMLCanvasElement): boolean {
//     return document.fullscreenElement === canvas;
//   }
//
//   public draw(ecs: ECS) {
//     const gl = this.gl;
//
//     gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
//
//     const mainCamera = ecs.queryFirst("MainCameraTag");
//     if (!mainCamera) {
//       console.log("[Renderer] Nothing to draw");
//       return;
//     }
//
//     const camData = ecs.getComponent(mainCamera, "CameraData")!;
//
//     // Only render meshes intersects with camera view frustum
//     const renderables = ecs.query("Renderable", "VisibleInFrustumTag", "ChunkTag");
//
//     for (const entity of renderables) {
//       const renderable = ecs.getComponent(entity, "Renderable")!;
//       if (!renderable.shader) continue;
//
//       // Bind shader and variables
//       gl.useProgram(renderable.shader.program);
//       gl.uniformMatrix4fv(renderable.shader.uniforms["uProjectionMatrix"] as WebGLUniformLocation, false, camData.projectionMatrix);
//       // gl.uniformMatrix4fv(renderable.shader.uniforms["uModelViewMatrix"] as WebGLUniformLocation, false, this.modelViewMatrix);
//       gl.uniformMatrix4fv(renderable.shader.uniforms["uViewMatrix"] as WebGLUniformLocation, false, camData.viewMatrix);
//       // gl.uniformMatrix4fv(renderable.shader.uniforms["uModelMatrix"] as WebGLUniformLocation, false, this.modelMatrix);
//
//       const chunkWorldPos = ChunkUtils.extractChunkPosFromHash(ecs.getComponent(entity, "ChunkData")!.chunkPosHash);
//       gl.uniform3fv(renderable.shader.uniforms["uChunkWorldPos"] as WebGLUniformLocation, [chunkWorldPos.x*16, 0, chunkWorldPos.z*16]);
//
//       if (this.setCustomUniforms) {
//         this.setCustomUniforms(gl, renderable.shader);
//       }
//
//       // Bind texture
//       gl.activeTexture(gl.TEXTURE0);
//       gl.bindTexture(gl.TEXTURE_2D, this.texture);
//       gl.uniform1i(renderable.shader.uniforms["uSampler"] as WebGLUniformLocation, 0);
//
//       // console.log(mesh.vertexCount);
//       gl.bindVertexArray(renderable.vao);
//       gl.drawElements(gl.TRIANGLES, renderable.vertexCount, gl.UNSIGNED_SHORT, 0);
//     }
//   }
// }


// ==============================

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

  public isCanvasHasPointerLocked(canvas: HTMLCanvasElement): boolean {
    return document.pointerLockElement === canvas;
  }

  public isCanvasFullScreen(canvas: HTMLCanvasElement): boolean {
    return document.fullscreenElement === canvas;
  }

  private setupUBO() {
    this.transformUBO = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.UNIFORM_BUFFER, this.transformUBO);
    this.gl.bufferData(this.gl.UNIFORM_BUFFER, 128, this.gl.DYNAMIC_DRAW);
    this.gl.bindBufferBase(this.gl.UNIFORM_BUFFER, 0, this.transformUBO);
    this.gl.bindBuffer(this.gl.UNIFORM_BUFFER, null);
  }

  public addPass(pass: RenderPass): void {
    this.passes.push(pass);
  }

  public draw(ecs: ECS): void {
    this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);

    this.updateGlobalUBO(ecs);

    for (const pass of this.passes) {
      pass.execute(ecs);
    }
  }

  private updateGlobalUBO(ecs: ECS) {
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
}
