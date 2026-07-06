import { mat4, vec4, vec3 } from "gl-matrix";
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

  private updateFrustumPlanes(camData: CameraData) {
    const vpMatrix = mat4.create();
    mat4.multiply(vpMatrix, camData.projectionMatrix, camData.viewMatrix);

    /*
      |           | Column 0 (X軸) | Column 1 (Y軸) | Column 2 (Z軸) | Column 3 (位移/透視) |
      |-----------|---------------|---------------|---------------|------------------|
      | Row 0 (x) | m[0]          | m[4]          | m[8]          | m[12]            |
      | Row 1 (y) | m[1]          | m[5]          | m[9]          | m[13]            |
      | Row 2 (z) | m[2]          | m[6]          | m[10]         | m[14]            |
      | Row 3 (w) | m[3]          | m[7]          | m[11]         | m[15]            |
    */

    // Six planes of frustum
    const m = vpMatrix;

    // Left
    vec4.set(camData.frustumPlanes[0], m[3] + m[0], m[7] + m[4], m[11] + m[8], m[15] + m[12]);
    // Right
    vec4.set(camData.frustumPlanes[1], m[3] - m[0], m[7] - m[4], m[11] - m[8], m[15] - m[12]);
    // Bottom
    vec4.set(camData.frustumPlanes[2], m[3] + m[1], m[7] + m[5], m[11] + m[9], m[15] + m[13]);
    // Top
    vec4.set(camData.frustumPlanes[3], m[3] - m[1], m[7] - m[5], m[11] - m[9], m[15] - m[13]);
    // Near
    vec4.set(camData.frustumPlanes[4], m[3] + m[2], m[7] + m[6], m[11] + m[10], m[15] + m[14]);
    // Far
    vec4.set(camData.frustumPlanes[5], m[3] - m[2], m[7] - m[6], m[11] - m[10], m[15] - m[14]);

    // Normalization 
    for (let i = 0; i < 6; i++) {
      const p = camData.frustumPlanes[i] as vec4;
      const length = Math.hypot(p[0], p[1], p[2]);
      vec4.scale(p, p, 1 / length);
    }
  }

  public update(deltaTime: number) {
    const cameraEntities = this.ecs.query("CameraTag", "Position", "Rotation", "CameraData", "DirtyFlag");

    for (const entity of cameraEntities) {
      const camData = this.ecs.getComponent(entity, "CameraData")!;
      const camViewDirtyFlag = this.ecs.getComponent(entity, "DirtyFlag")!;

      if (camViewDirtyFlag.isDirty) {
        const position = this.ecs.getComponent(entity, "Position")!;
        const rot = this.ecs.getComponent(entity, "Rotation")!;

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

        this.updateFrustumPlanes(camData);

        camViewDirtyFlag.isDirty = false;
      }
    }
  }
}
