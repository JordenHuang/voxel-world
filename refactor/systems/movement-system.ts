import { ECS } from "../ecs";
import { EventBus } from "../event-bus";
import type { System } from "./index";
import { PhysicUtils, WorldUtils } from "../utils/";

export class MovementSystem implements System {
  private ecs: ECS;

  constructor(ecs: ECS) {
    this.ecs = ecs;
  }

  public update(deltaTime: number) {
    deltaTime = Math.min(deltaTime, 32);

    const movables = this.ecs.query("Position", "Velocity", "AABB");

    // Grab global world data for the block check
    const worldEntity = this.ecs.queryFirst("WorldData", "WorldInfo");
    if (!worldEntity) {
      return;
    }
    const worldData = this.ecs.getComponent(worldEntity, "WorldData")!;
    const worldInfo = this.ecs.getComponent(worldEntity, "WorldInfo")!;

    // Closure to pass to our pure physics util
    const getBlockFn = (x: number, y: number, z: number) => {
      return WorldUtils.worldGetBlock(this.ecs, worldInfo, worldData, x, y, z);
    };

    const epsilon = 0.001;

    for (const entity of movables) {
      const pos = this.ecs.getComponent(entity, "Position")!;
      const vel = this.ecs.getComponent(entity, "Velocity")!;
      const aabb = this.ecs.getComponent(entity, "AABB")!;

      // 1. Apply Gravity to Velocity
      vel.value[1] -= 0.00001 * deltaTime; // Gravity (tune this number for jump feel)

      // // 2. Y-Axis (Vertical)
      pos.value[1] += vel.value[1] * deltaTime;
      if (PhysicUtils.checkVoxelCollision(pos.value[0], pos.value[1], pos.value[2], aabb, getBlockFn)) {
        if (vel.value[1] > 0) { // Hit ceiling
          pos.value[1] = Math.floor(pos.value[1] + aabb.halfHeight) - aabb.halfHeight - epsilon;
        } else if (vel.value[1] < 0) { // Hit floor
          pos.value[1] = Math.ceil(pos.value[1] - aabb.halfHeight) + aabb.halfHeight + epsilon;
          const playerData = this.ecs.getComponent(entity, "PlayerData");
          if (playerData) playerData.isOnTheGround = true;
        }
        vel.value[1] = 0; // Stop vertical movement
      }

      // 3. X-Axis (Horizontal)
      pos.value[0] += vel.value[0] * deltaTime;
      if (PhysicUtils.checkVoxelCollision(pos.value[0], pos.value[1], pos.value[2], aabb, getBlockFn)) {
        if (vel.value[0] > 0) {
          pos.value[0] = Math.floor(pos.value[0] + aabb.halfWidth) - aabb.halfWidth - epsilon;
        } else if (vel.value[0] < 0) {
          pos.value[0] = Math.ceil(pos.value[0] - aabb.halfWidth) + aabb.halfWidth + epsilon;
        }
        vel.value[0] = 0;
      }

      // 4. Z-Axis (Depth)
      pos.value[2] += vel.value[2] * deltaTime;
      if (PhysicUtils.checkVoxelCollision(pos.value[0], pos.value[1], pos.value[2], aabb, getBlockFn)) {
        if (vel.value[2] > 0) {
          pos.value[2] = Math.floor(pos.value[2] + aabb.halfDepth) - aabb.halfDepth - epsilon;
        } else if (vel.value[2] < 0) {
          pos.value[2] = Math.ceil(pos.value[2] - aabb.halfDepth) + aabb.halfDepth + epsilon;
        }
        vel.value[2] = 0;
      }
    }
  }
}
