import { ECS } from "../ecs";
import { EventBus } from "../event-bus";
import type { System } from "./index";
import { createChunk } from "../entities/chunk";
import type { Entity } from "../entities/";
import type { WorldData } from "../components/";
import type { ChunkPos, ChunkPosHash } from "../types/chunk";
import { calculateChunkPosHash, extractChunkPosFromHash } from "../utils";
import { Shader } from "../shader";

export class WorldSystem implements System {
  private ecs: ECS;
  private eventBus: EventBus;
  private gl: WebGL2RenderingContext;
  private shader: Shader;

  constructor(ecs: ECS, eventBus: EventBus, gl: WebGL2RenderingContext, shader: Shader) {
    this.ecs = ecs;
    this.eventBus = eventBus;
    this.gl = gl;
    this.shader = shader;
  }

  public update(deltaTime: number) {
    // NOTE: Assume there's only one player, one world
    const playerEntity = this.ecs.queryFirst("PlayerTag", "Position");
    if (!playerEntity) return;

    const playerPosition = this.ecs.getComponent(playerEntity, "Position")!;

    const worldEntity = this.ecs.queryFirst("WorldData", "WorldInfo");
    if (!worldEntity) return;

    const worldData = this.ecs.getComponent(worldEntity, "WorldData")!;
    const worldInfo = this.ecs.getComponent(worldEntity, "WorldInfo")!;

    // Desire chunks
    const desireChunks: Set<ChunkPosHash> = new Set<ChunkPosHash>();
    const x = Math.floor(playerPosition.value[0] / worldInfo.CHUNK_SIZE);
    const z = Math.floor(playerPosition.value[2] / worldInfo.CHUNK_SIZE);

    const rd = worldInfo.RENDER_DISTANCE;
    for (let i = -rd; i <= rd; i++) {
      for (let j = -rd; j <= rd; j++) {
        const chunkPos = calculateChunkPosHash({
          x: i + x,
          z: j + z,
        });
        desireChunks.add(chunkPos);
      }
    }

    // Add desire chunks to chunk list
    for (const desireChunk of desireChunks) {
      if (!worldData.chunks.has(desireChunk)) {
        const newChunkEntity = createChunk(
          this.ecs,
          worldInfo, worldEntity, desireChunk, this.shader,
        );
        if (this.ecs.hasComponent(worldEntity, "WOverworldTag")) {
          this.ecs.attachComponent(newChunkEntity, "WOverworldTag", {});
        } else if (this.ecs.hasComponent(worldEntity, "WNetherTag")) {
          this.ecs.attachComponent(newChunkEntity, "WNetherTag", {});
        }
        this.ecs.attachComponent(newChunkEntity, "NeedsGenerationTag", {});

        worldData.chunks.set(desireChunk, newChunkEntity);
      }
    }

    for (const chunk of worldData.chunks.keys()) {
      // Unload chunks that's not in desire chunk list
      if (!desireChunks.has(chunk)) {
        this.unloadChunk(worldData, chunk);
      }
    }

  }

  private unloadChunk(worldData: WorldData, chunk: ChunkPosHash) {
    const chunkEntity = worldData.chunks.get(chunk)!;
    this.ecs.destroyEntity(chunkEntity);
    worldData.chunks.delete(chunk);
  }
}

