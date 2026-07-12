import Perlin from "../../thirdparty/perlin";
import { ECS } from "../../ecs";
import { EventBus } from "../../event-bus";
import type { System } from "../index";
import { BlockUtils } from "../../utils/";

import {
  ChunkUtils,
  WorldUtils,
} from "../../utils/";

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

    let chunksGeneratedThisFrame = 0;
    const MAX_CHUNKS_PER_FRAME = 4;

    for (const chunk of chunkEntities) {
      chunksGeneratedThisFrame++;
      if (chunksGeneratedThisFrame >= MAX_CHUNKS_PER_FRAME) {
          break; 
      }

      const chunkData = this.ecs.getComponent(chunk, "ChunkData")!;

      const world = chunkData.worldId;
      const worldInfo = this.ecs.getComponent(world, "WorldInfo")!;
      const worldData = this.ecs.getComponent(world, "WorldData")!;
      const size = worldInfo.CHUNK_SIZE;
      const height = worldInfo.CHUNK_HEIGHT;

      const chunkPos = ChunkUtils.extractChunkPosFromHash(chunkData.chunkPosHash);
      const genFloatingIsland = Math.random() < 0.01;

      // Generate blocks in chunk
      for (let x = 0; x < size; x++) {
        for (let z = 0; z < size; z++) {
          for (let y = 0; y < 4; y++) {
            const index = ChunkUtils.chunkGetIndex(worldInfo, x, y, z);
            chunkData.blocks[index] = BlockUtils.BlockId.STONE;
          }

          const worldX = x + chunkPos.x * size;
          const worldZ = z + chunkPos.z * size;
          const perlinHeight = Math.abs(
            this.noise.perlin2(worldX/100, worldZ/100)
              + this.noise.perlin2(worldX/80, worldZ/80)
              + this.noise.perlin2(worldX/30, worldZ/30)
          );

          const yHeight = Math.round(perlinHeight * (worldInfo.CHUNK_HEIGHT / 3 * 2));
          const dirtLayers = Math.round(Math.random() * 10);
          for (let y = 4; y <= yHeight; y++) {
            const index = ChunkUtils.chunkGetIndex(worldInfo, x, y, z);

            if (y < yHeight - dirtLayers) {
              chunkData.blocks[index] = BlockUtils.BlockId.STONE;
            } else if (y == yHeight) {
              // if (Math.random() < 0.8)
              //   chunkData.blocks[index] = BlockUtils.BlockId.GRASS;
              // else
              chunkData.blocks[index] = BlockUtils.BlockId.GRASS_DIRT;
            } else {
              chunkData.blocks[index] = BlockUtils.BlockId.DIRT;
            }
          }

          // Floating island
          if (genFloatingIsland) {
            const islandHeight = Math.round(perlinHeight * (worldInfo.CHUNK_HEIGHT / 6));
            for (let y = height-5 - islandHeight/2; y <= height-5 + islandHeight/2; y++) {
              const index = ChunkUtils.chunkGetIndex(worldInfo, x, y, z);
              chunkData.blocks[index] = BlockUtils.BlockId.LOG;
            }
          }

        }
      }

      this.ecs.removeComponent(chunk, "NeedsGenerationTag");
      this.ecs.attachComponent(chunk, "DirtyFlag", { isDirty: true });

      // Inform neighbor chunks to update
      const neighbors = [
        { x: chunkPos.x + 1, z: chunkPos.z },
        { x: chunkPos.x - 1, z: chunkPos.z },
        { x: chunkPos.x, z: chunkPos.z + 1 },
        { x: chunkPos.x, z: chunkPos.z - 1 }
      ];

      for (const n of neighbors) {
        const hash = ChunkUtils.calculateChunkPosHash(n);
        const neighborEntity = WorldUtils.worldGetChunk(worldData, hash);

        if (neighborEntity !== undefined) {
          this.ecs.attachComponent(neighborEntity, "DirtyFlag", { isDirty: true });
        }
      }
    }
  }
}
