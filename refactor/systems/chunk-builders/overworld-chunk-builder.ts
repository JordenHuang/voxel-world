import Perlin from "../../thirdparty/perlin";
import { ECS } from "../../ecs";
import { EventBus } from "../../event-bus";
import type { System } from "../index";
import {
  extractChunkPosFromHash,
  worldSetBlockAndUpdateMesh,
} from "../../utils";

export class OverworldChunkBuilder implements System {
  private ecs: ECS;
  private eventBus: EventBus;
  private seed: number;
  private noise: Perlin;

  constructor(ecs: ECS, eventBus: EventBus, seed?: number) {
    this.ecs = ecs;
    this.eventBus = eventBus;

    if (seed !== undefined) {
      this.seed = seed;
    } else {
      this.seed = Math.random();
    }

    this.noise = new Perlin(this.seed);
  }

  public update(deltaTime: number) {
    const chunkEntities = this.ecs.query("WOverworldTag", "ChunkData", "NeedsGenerationTag");

    for (const chunk of chunkEntities) {
      const chunkData = this.ecs.getComponent(chunk, "ChunkData")!;

      const world = chunkData.worldId;
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
            this.noise.perlin2(worldX/100, worldZ/100)
              + this.noise.perlin2(worldX/80, worldZ/80)
              + this.noise.perlin2(worldX/30, worldZ/30)
          );
          const yHeight = Math.max(3, Math.floor(perlinHeight * worldInfo.CHUNK_HEIGHT));
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

      this.ecs.removeComponent(chunk, "NeedsGenerationTag");
      this.ecs.attachComponent(chunk, "DirtyFlag", { isDirty: true });
    }
  }
}
