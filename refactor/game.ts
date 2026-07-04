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

  // Blue pixel as a laceholder when the texture is loading
  const pixel = new Uint8Array([0, 0, 255, 255]);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, pixel);

  const image = new Image();
  image.crossOrigin = "anonymous";
  image.onload = () => {
    // gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);

    const isPowerOf2 = (value: number) => (value & (value - 1)) === 0;

    if (isPowerOf2(image.width) && isPowerOf2(image.height)) {
      gl.generateMipmap(gl.TEXTURE_2D);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    } else {
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    }
  };
  image.src = url;

  return texture;
}

export class Game {
  private canvas: HTMLCanvasElement;
  private gl: WebGL2RenderingContext;
  private lastTimestamp = 0;

  private ecs: ECS;
  private eventBus: EventBus;

  private blockShader: Shader;

  private player: Entity;
  private camera: Entity;
  private world: Entity;

  private playerControlSystem: Systems.PlayerControlSystem;
  private cameraSystem: Systems.CameraSystem;
  private inputSystem: Systems.InputSystem;
  private renderSystem: Systems.RenderSystem;
  private targetFollowerSystem: Systems.TargetFollowerSystem;
  private movementSystem: Systems.MovementSystem;

  private worldSystem: Systems.WorldSystem;
  private OverworldChunkBuilder: Systems.OverworldChunkBuilder;
  private chunkMeshBuilder: Systems.ChunkMeshBuilder;

  private fpsLabel: HTMLElement;
  private fpsAverage: SlidingFpsAverage;

  constructor() {
    this.canvas = document.getElementById("game-canvas") as HTMLCanvasElement;
    if (this.canvas === null) {
      throw new Error("Unable to locate canvas element.");
    }

    this.gl = this.canvas.getContext("webgl2") as WebGL2RenderingContext;
    if (this.gl === null) {
      throw new Error("Unable to initialize WebGL. Your browser or machine may not support it.");
    }

    this.fpsLabel = document.getElementById("fps-label") as HTMLElement;
    this.fpsAverage = new SlidingFpsAverage(10);

    this.ecs = new ECS();
    this.eventBus = new EventBus();

    let blockShader = new Shader(this.gl, vsSource, fsSource);
    this.blockShader = blockShader;

    this.player = Entities.createPlayer(this.ecs);
    this.camera = Entities.createCamera(this.ecs, {
      aspectRatio: this.canvas.width / this.canvas.height,
      targetEntityId: this.player,
      isMainCamera: true,
    } as Entities.CameraOptions);

    const worldOptions = {
      CHUNK_HEIGHT: 32,
      CHUNK_SIZE: 16,
      RENDER_DISTANCE: 8,
    };
    this.world = Entities.createMainWorld(this.ecs, worldOptions);

    const seed = 0;
    let texture = loadTexture(this.gl, "./assets/frame.png");

    const setCustomUniforms = (gl: WebGL2RenderingContext, blockShader: Shader) => {
      gl.uniform1f(blockShader.uniforms["uChunkHeight"] as WebGLUniformLocation, worldOptions.CHUNK_HEIGHT);
      // gl.uniform1f(shader.uniforms["uTime"] as WebGLUniformLocation, this.player.position[0] * this.player.position[2]);
    }

    // Systems
    this.inputSystem = new Systems.InputSystem(this.ecs, this.eventBus);
    this.playerControlSystem = new Systems.PlayerControlSystem(this.ecs, this.eventBus);
    this.movementSystem = new Systems.MovementSystem(this.ecs);
    this.targetFollowerSystem = new Systems.TargetFollowerSystem(this.ecs);
    this.cameraSystem = new Systems.CameraSystem(this.ecs, this.eventBus);

    this.worldSystem = new Systems.WorldSystem(this.ecs, this.eventBus, this.gl);
    this.OverworldChunkBuilder = new Systems.OverworldChunkBuilder(this.ecs, this.eventBus, seed);
    this.chunkMeshBuilder = new Systems.ChunkMeshBuilder(this.ecs, this.eventBus, this.gl, this.blockShader);

    this.renderSystem = new Systems.RenderSystem(this.ecs, this.eventBus, this.canvas, this.gl, texture, setCustomUniforms);
  }

  private gameLoop(timestamp: number, texture: WebGLTexture) {
    const deltaTime = (timestamp - this.lastTimestamp); // In millisecond
    this.lastTimestamp = timestamp;

    this.inputSystem.update(deltaTime);
    this.playerControlSystem.update(deltaTime);
    this.movementSystem.update(deltaTime);
    this.targetFollowerSystem.update(deltaTime);
    this.cameraSystem.update(deltaTime);

    this.worldSystem.update(deltaTime);
    this.OverworldChunkBuilder.update(deltaTime);
    this.chunkMeshBuilder.update(deltaTime);

    this.renderSystem.update(deltaTime);

    this.inputSystem.clearFrameData();

    const fps = Math.round(1 / deltaTime*1000);
    this.fpsAverage.add(fps);
    this.fpsLabel.innerText = `FPS: ${this.fpsAverage.getAverage().toFixed(1)}`;

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
