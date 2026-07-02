import { ECS } from "../ecs";
import type { Entity } from "../entities/";
import type { WorldInfo } from "../components/";
import type { ChunkPosHash } from "../types/chunk";

export interface MainWorldOptions {
  seed?: number;
  CHUNK_HEIGHT?: number;
  CHUNK_SIZE?: number;
  RENDER_DISTANCE?: number;
}

export function createMainWorld(ecs: ECS, options: MainWorldOptions): Entity {
  const world = ecs.createEntity();

  ecs.attachComponent(world, "WOverworldTag", {});

  ecs.attachComponent(world, "WorldInfo", {
    CHUNK_SIZE: options.CHUNK_SIZE ?? 16,
    CHUNK_HEIGHT: options.CHUNK_HEIGHT ?? 32,
    RENDER_DISTANCE: options.RENDER_DISTANCE ?? 32,
  });

  let seed: number;
  if (options.seed)
    seed = options.seed;
  else
    seed = Math.random();

  ecs.attachComponent(world, "WorldData", {
    name: "MainWorld",
    seed: seed,
    chunks: new Map<ChunkPosHash, Entity>(),
  });

  return world;
}

export function createNetherWorld(ecs: ECS, worldInfo: WorldInfo, seed: number | null): Entity {
  throw new Error("Function `createNetherWorld` unimplemented");

  const world = ecs.createEntity();
  ecs.attachComponent(world, "WNetherTag", {});
  return world;
}
