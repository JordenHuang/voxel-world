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

    this.updateAspectRatio();

    this.setupEventSubscriptions();
  }

  private setupEventSubscriptions() {
    this.eventBus.on("UPDATE_ASPECT_RATIO", (size) => {
      this.updateAspectRatio(size);
    });
  }

  private updateAspectRatio(size?: {width: number, height: number}) {
    const cameraEntity = this.ecs.queryFirst("MainCameraTag");
    if (!cameraEntity) return;

    const camData = this.ecs.getComponent(cameraEntity, "CameraData")!;

    if (size) {
      camData.aspectRatio = size.width / size.height;
    }

    this.updateProjectionMatrix(camData);
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
    const cameraEntities = this.ecs.query("CameraTag", "Position", "Rotation", "CameraData", "DirtyFlag");

    for (const entity of cameraEntities) {
      const camData = this.ecs.getComponent(entity, "CameraData")!;
      const camViewDirtyFlag = this.ecs.getComponent(entity, "DirtyFlag")!;

      if (camViewDirtyFlag.isDirty) {
        const position = this.ecs.getComponent(entity, "Position")!;
        const rot = this.ecs.getComponent(entity, "Rotation")!;

    //   const camFollower = this.ecs.getComponent(entity, "TargetFollower")!;
    //   if (camFollower.targetEntityId != -1) {
    //       const input = this.ecs.getComponent(camFollower.targetEntityId, "InputState")!;
    //
    //       // TODO: sensitivity
    //       const sensitivity: number = 0.002
    // //       rot.pitch += input.deltaY * sensitivity * -1;
    // // // Limit yaw angle to avoid gimbal lock
    // // const pitchLimit = 89.9 * Math.PI / 180; // 89.9 degree
    // // rot.pitch = Math.max(Math.min(rot.pitch, pitchLimit), -pitchLimit);
    //
    //   // rot.yaw += input.deltaX * sensitivity;
    //   }

        // Front vector
        vec3.set(camData.front,
          Math.cos(rot.pitch) * Math.cos(rot.yaw),
          Math.sin(rot.pitch),
          Math.cos(rot.pitch) * Math.sin(rot.yaw)
        );
        vec3.normalize(camData.front, camData.front);

        // Right vector
        vec3.cross(camData.right, camData.front, camData.up);
        vec3.normalize(camData.right, camData.right);

        // Up vector
        vec3.set(camData.up, 0, 1, 0); // Up is positive Y-axis

        this.updateViewMatrix(position.value, camData);

        camViewDirtyFlag.isDirty = false;
      }
    }
  }
}
