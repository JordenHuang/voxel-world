import { ECS } from "../ecs";
import { EventBus } from "../event-bus";
import type { System } from "./index";

export class MovementSystem implements System {
  private ecs: ECS;

  constructor(ecs: ECS) {
    this.ecs = ecs;
  }

  public update(deltaTime: number) {
    const movables = this.ecs.query("Position", "Velocity");

    for (const entity of movables) {
      const pos = this.ecs.getComponent(entity, "Position")!;
      const vel = this.ecs.getComponent(entity, "Velocity")!;

      // 真正的位移發生在這裡 (記得乘上 deltaTime，因為這是一幀的時間)
      // 未來所有的地形碰撞偵測 (AABB Collision) 也全部集中寫在這裡！
      pos.value[0] += vel.value[0] * deltaTime;
      pos.value[1] += vel.value[1] * deltaTime;
      pos.value[2] += vel.value[2] * deltaTime;
    }
  }
}
