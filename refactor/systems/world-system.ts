import { ECS } from "../ecs";
import { EventBus } from "../event-bus";
import type { System } from "./index";
import { createChunk } from "../entities/chunk";
import type { WorldData } from "../components/";
import type { ChunkPosHash } from "../types/chunk";
import {
  ChunkUtils,
  WorldUtils,
} from "../utils/";

export class WorldSystem implements System {
  private ecs: ECS;
  private eventBus: EventBus;

  // TODO: Scheduled updates, for water/sand fall/redstone
  // components/scheduled-updates.ts
  // export type ScheduledUpdates = {
  //   // 記錄：[執行時間戳或幀數, X, Y, Z, 方塊類型]
  //   queue: Array<{ tick: number, x: number, y: number, z: number, id: number }>;
  // };

  constructor(ecs: ECS, eventBus: EventBus) {
    this.ecs = ecs;
    this.eventBus = eventBus;
  }

  private unloadChunk(worldData: WorldData, chunk: ChunkPosHash) {
    const chunkEntity = worldData.chunks.get(chunk)!;
    this.ecs.destroyEntity(chunkEntity);
    worldData.chunks.delete(chunk);
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
        const chunkPos = ChunkUtils.calculateChunkPosHash({
          x: i + x,
          z: j + z,
        });
        desireChunks.add(chunkPos);
      }
    }

    // Load new chunks
    for (const desireChunk of desireChunks) {
      // Add desire chunks to chunk list
      if (!worldData.chunks.has(desireChunk)) {
        const newChunkEntity = createChunk(
          this.ecs,
          worldInfo, worldEntity, desireChunk
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

    // Chunks that are too far, unloaded it
    for (const chunk of worldData.chunks.keys()) {
      if (!desireChunks.has(chunk)) {
        // Inform neighbor chunks to update mesh
        const chunkPos = ChunkUtils.extractChunkPosFromHash(chunk);
        const neighbors = [
          { x: chunkPos.x + 1, z: chunkPos.z },
          { x: chunkPos.x - 1, z: chunkPos.z },
          { x: chunkPos.x, z: chunkPos.z + 1 },
          { x: chunkPos.x, z: chunkPos.z - 1 }
        ];

        for (const n of neighbors) {
          const neighborHash = ChunkUtils.calculateChunkPosHash(n);
          const neighborEntity = WorldUtils.worldGetChunk(worldData, neighborHash);
          if (neighborEntity !== undefined) {
            this.ecs.attachComponent(neighborEntity, "DirtyFlag", { isDirty: true });
          }
        }

      // Unload chunks that's not in desire chunk list
        this.unloadChunk(worldData, chunk);
      }
    }

  }
}

