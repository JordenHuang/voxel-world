import { ECS } from "../ecs";
import { EventBus } from "../event-bus";
import type { System } from "./index";
import type { Entity } from "../entities";
import {
  calculateChunkPosHash,
  extractChunkPosFromHash,
  chunkSetBlock,
  worldSetBlockAndUpdateMesh,
} from "../utils";

export class ChunkBuilder implements System {
  private ecs: ECS;
  private eventBus: EventBus;

  constructor(ecs: ECS, eventBus: EventBus) {
    this.ecs = ecs;
    this.eventBus = eventBus;
  }


  public update(deltaTime: number) {
    const chunkEntities = this.ecs.query("ChunkData", "DirtyFlag");

    for (const chunk of chunkEntities) {
      const chunkData = this.ecs.getComponent(chunk, "ChunkData")!;
      const chunkDirtyFlag = this.ecs.getComponent(chunk, "DirtyFlag")!;

      if (!chunkDirtyFlag.isDirty) continue;

      const world = chunkData.ownedByWorld;
      const worldInfo = this.ecs.getComponent(world, "WorldInfo")!;
      const worldData = this.ecs.getComponent(world, "WorldData")!;
      const size = worldInfo.CHUNK_SIZE;
      const height = worldInfo.CHUNK_HEIGHT;

      const chunkPos = extractChunkPosFromHash(chunkData.chunkPosHash);

      // Generate blocks in chunk
      for (let x = 0; x < size; x++) {
        for (let z = 0; z < size; z++) {
          const worldX = x + chunkPos.x * size;
          const worldZ = z + chunkPos.z * size;
          const perlinHeight = Math.abs(
            worldData.noise.perlin2(worldX/100, worldZ/100)
              + worldData.noise.perlin2(worldX/80, worldZ/80)
              + worldData.noise.perlin2(worldX/30, worldZ/30)
          );
          const yHeight = Math.max(1, Math.floor(perlinHeight * worldInfo.CHUNK_HEIGHT));
          for (let y = 0; y < yHeight; y++) {
            // chunkSetBlock(chunkData, chunkDirtyFlag, worldInfo, x, y, z, 1);
            worldSetBlockAndUpdateMesh(this.ecs, world, worldX, y, worldZ, 1);
          }

          // for (let y = 0; y < 1; y++) {
          //   chunkSetBlock(chunkData, chunkDirtyFlag, worldInfo, x, y, z, 1);
          //   if (x == 0 && z == 0) chunkSetBlock(chunkData, chunkDirtyFlag, worldInfo, x, y+1, z, 1);
          // }

        }
      }
    }
  }
}
