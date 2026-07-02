import Perlin from "../thirdparty/perlin";
import { ECS } from "../ecs";
import type { Entity } from "../entities/";
import type { WorldInfo } from "../components/";
import type { ChunkPosHash } from "../types/chunk";

export function createWorld(ecs: ECS, worldInfo: WorldInfo, seed: number | null): Entity {
  const world = ecs.createEntity();

  ecs.attachComponent(world, "WorldInfo", worldInfo);

  if (typeof seed == null)
    seed = Math.random();
  else
    seed = seed as number;

  ecs.attachComponent(world, "WorldData", {
    name: "MainWorld",
    seed: seed,
    chunks: new Map<ChunkPosHash, Entity>(),
    noise: new Perlin(seed),
  });

  return world;
}
