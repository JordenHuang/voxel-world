import { vec3 } from "gl-matrix";
import { ECS } from "../ecs";
import type { System } from "./system";

export class TargetFollowerSystem implements System {
  private ecs: ECS;

  constructor(ecs: ECS) {
    this.ecs = ecs;
  }

  public update(deltaTime: number) {
    // 找出所有「擁有位置」且「需要跟隨別人」的實體 (例如我們的相機)
    const followers = this.ecs.query("Position", "TargetFollower");

    for (const follower of followers) {
      const camPos = this.ecs.getComponent(follower, "Position")!;
      const camRot = this.ecs.getComponent(follower, "Rotation")!;
      const followData = this.ecs.getComponent(follower, "TargetFollower")!;

      // 去尋找目標 (玩家) 的位置
      const targetPos = this.ecs.getComponent(followData.targetEntityId, "Position");
      const targetRot = this.ecs.getComponent(followData.targetEntityId, "Rotation");

      // 如果目標不存在 (例如玩家死掉被銷毀了)，相機就不動
      if (!targetPos || !targetRot) continue;

      camRot.yaw = targetRot.yaw;
      camRot.pitch = targetRot.pitch;
      camRot.roll = targetRot.roll;

      // 計算相機「理想中」應該要在哪裡 (目標位置 + 偏移量)
      // 嚴格寫法：直接設定位置 (瞬間移動，適合第一人稱 First-person)
      vec3.add(camPos, targetPos, followData.offset);

      // 進階寫法：使用 Lerp (線性插值) 讓相機平滑移動 (適合第三人稱)
      // const speed = followData.lerpFactor * deltaTime/1000; 
      // vec3.scaleAndAdd(camPos, camPos, vec3.sub(vec3.create(), targetPos, camPos), speed);

      // 如果這個跟隨者剛好是相機，我們必須標記它的 ViewMatrix 需要重算
      const camData = this.ecs.getComponent(follower, "DirtyFlag");
      if (camData) {
        camData.isDirty = true;
      }
    }
  }
}
