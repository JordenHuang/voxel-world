// systems/CameraSystem.ts
import { mat4, vec3 } from "gl-matrix";

import { ECS } from "../ecs";
import { EventBus } from "../event-bus";
import type { CameraData } from "../components";
import type { System } from "./index";

export class CameraSystem implements System {
  private ecs: ECS;
  private eventBus: EventBus;

  constructor(ecs: ECS, eventBus: EventBus) {
    this.ecs = ecs;
    this.eventBus = eventBus;

    this.setupSubscriptions();
  }

  private setupSubscriptions() {
    // 監聽螢幕改變大小的事件
    this.eventBus.on("UPDATE_ASPECT_RATIO", (size) => {
      const cameraEntities = this.ecs.query("CameraData");

      for (const entity of cameraEntities) {
        const camData = this.ecs.getComponent(entity, "CameraData")!;

        camData.aspectRatio = size.width / size.height;

        this.updateProjectionMatrix(camData);
      }
    });
  }

  private updateViewMatrix(position: vec3, camData: CameraData) {
    const lookAtTarget = vec3.create();
    vec3.add(lookAtTarget, position, camData.front);
    mat4.lookAt(camData.viewMatrix, position, lookAtTarget, camData.up);
  }

  private updateProjectionMatrix(camData: CameraData) {
    mat4.perspective(camData.projectionMatrix, camData.fov, camData.aspectRatio, camData.near, camData.far);
  };

  public update(deltaTime: number) {
    const cameraEntities = this.ecs.query("Position", "Rotation", "CameraData");

    for (const entity of cameraEntities) {
      const camData = this.ecs.getComponent(entity, "CameraData")!;

      if (camData.isViewDirty) {
        const pos = this.ecs.getComponent(entity, "Position")!;
        const rot = this.ecs.getComponent(entity, "Rotation")!;

        // Front vector
        camData.front = vec3.fromValues(
          pos.x + Math.cos(rot.pitch) * Math.cos(rot.yaw),
          pos.y + Math.sin(rot.pitch),
          pos.z + Math.cos(rot.pitch) * Math.sin(rot.yaw)
        );
        vec3.normalize(camData.front, camData.front);

        // Right vector
        vec3.cross(camData.right, camData.front, camData.up);
        vec3.normalize(camData.right, camData.right);

        // Up vector
        vec3.set(camData.up, 0, 1, 0); // Up is positive Y-axis

        const positionVec = vec3.fromValues(pos.x, pos.y, pos.z);
        this.updateViewMatrix(positionVec, camData);

        camData.isViewDirty = false;
      }
    }
  }
}
