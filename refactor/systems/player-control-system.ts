import { vec3 } from "gl-matrix";

import { ECS } from "../ecs";
import { EventBus } from "../event-bus";

import type { System } from "./index";

export class PlayerControlSystem implements System {
  private ecs: ECS;
  private eventBus: EventBus;

  constructor(ecs: ECS, eventBus: EventBus) {
    this.ecs = ecs;
    this.eventBus = eventBus;

    this.setupSubscriptions();
  }

  private setupSubscriptions() {}

  public update(deltaTime: number) {
    const players = this.ecs.query("PlayerTag", "Position", "Rotation");
    const mainCamera = this.ecs.queryFirst("MainCameraTag", "CameraData");
    const moveDir = vec3.create();

    for (const player of players) {
      // let movementSpeed = player.movementSpeed;  // TODO:
      let movementSpeed = 0.003;
      vec3.set(moveDir, 0, 0, 0);

      const pos = this.ecs.getComponent(player, "Position")!;
      const rot = this.ecs.getComponent(player, "Rotation")!;
      const input = this.ecs.getComponent(player, "InputState")!;

      const position = vec3.fromValues(pos.x, pos.y, pos.z);
      // const rotation = vec3.fromValues(rot.yaw, rot.pitch, rot.roll);

      let front: vec3;
      let right: vec3;
      let up: vec3;

      if (mainCamera) {
        const camData = this.ecs.getComponent(mainCamera, "CameraData")!;
        front = camData.front;
        right = camData.right;
        up    = camData.up;
      } else {
        const dv = getDirectionVectors(rot);
        front = dv.front;
        right = dv.right;
        up    = dv.up;
      }

      if (input.moveForward) {
        vec3.add(moveDir, moveDir, front);
      }
      if (input.moveBackward) {
        vec3.sub(moveDir, moveDir, front);
      }
      if (input.moveLeft) {
        vec3.sub(moveDir, moveDir, right);
      }
      if (input.moveRight) {
        vec3.add(moveDir, moveDir, right);
      }

      // Lock Y-axis movement
      moveDir[1] = 0;

      if (input.jump) {
        vec3.add(moveDir, moveDir, up);
      }
      if (input.sneak) {
        vec3.sub(moveDir, moveDir, up);
      }
      if (input.sprint) {
        movementSpeed *= 5;
      }

      vec3.normalize(moveDir, moveDir);

      vec3.scale(moveDir, moveDir, movementSpeed * deltaTime);
      vec3.add(position, position, moveDir);
      pos.x = position[0];
      pos.y = position[1];
      pos.z = position[2];

      if (mainCamera) {
        const cameraRot = this.ecs.getComponent(mainCamera, "Rotation")!;

        if (input.reset) {
          pos.x = 0;
          pos.y = 0;
          pos.z = 0;

          cameraRot.yaw   = -Math.PI / 2;
          cameraRot.pitch = 0;
          // cameraRot.roll  = 0;
          rot.yaw   = cameraRot.yaw;
          rot.pitch = cameraRot.pitch;
          rot.roll  = cameraRot.roll;
        } else {
          rot.yaw   = cameraRot.yaw;
          rot.pitch = cameraRot.pitch;
          rot.roll  = cameraRot.roll;
        }
      }

    }
  }
}


import type { Rotation } from "../components";

interface DirectionVectors {
  front: vec3;
  right: vec3;
  up: vec3;
}

function getDirectionVectors(rot: Rotation): DirectionVectors {
  const front = vec3.create();
  // 1. 利用三角函數算出前方 (Front) 向量
  // 這裡的公式對應你之前在 CameraSystem 寫的數學邏輯
  front[0] = Math.cos(rot.pitch) * Math.cos(rot.yaw);
  front[1] = Math.sin(rot.pitch);
  front[2] = Math.cos(rot.pitch) * Math.sin(rot.yaw);
  vec3.normalize(front, front);

  // 2. 利用外積 (Cross Product) 算出右方 (Right) 向量
  // 前方向量 (Front) 與 世界正上方 (0, 1, 0) 做外積，就會得到右方
  const right = vec3.create();
  const worldUp = vec3.fromValues(0, 1, 0);
  vec3.cross(right, front, worldUp);
  vec3.normalize(right, right);

  // 3. 再次利用外積算出真實的上方 (Up) 向量
  // 右方向量 (Right) 與 前方向量 (Front) 做外積，就會得到相對於該實體頭頂的上方
  const up = vec3.create();
  vec3.cross(up, right, front);
  vec3.normalize(up, up);

  return { front, right, up };
}
