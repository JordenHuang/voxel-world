import { mat4, vec3 } from "gl-matrix";

import { ECS } from "../ecs";
import type { Entity } from "./entity";
import type { Position } from "../components/";
import type { Rotation } from "../components/";

export interface CameraOptions {
  position?: Position;
  rotation?: Rotation;
  fov?: number;
  aspectRatio?: number;
  near?: number;
  far?: number;
  targetEntityId?: number;
  isMainCamera?: boolean
}

// TODO: Replace default ... with CameraOptions
export function createCamera(ecs: ECS, options: CameraOptions = {}): Entity {
  const cameraEntity = ecs.createEntity();

  ecs.attachComponent(cameraEntity, "CameraTag", {});

  if (options.isMainCamera) {
    ecs.attachComponent(cameraEntity, "MainCameraTag", {});
  }

  const position = options.position ?? vec3.fromValues(0, 0, 0);
  ecs.attachComponent(cameraEntity, "Position", position);

  const pitch = options.rotation?.pitch ?? 0;
  const yaw = options.rotation?.yaw ?? -Math.PI / 2;
  const roll = options.rotation?.roll ?? 0;
  ecs.attachComponent(cameraEntity, "Rotation", {
    pitch: pitch,
    yaw: yaw,
    roll: roll,
  });

  const fov = options.fov ?? (45 * Math.PI) / 180;
  const aspectRatio = options.aspectRatio ?? 800 / 600;
  const near = options.near ?? 0.1;
  const far = options.far ?? 1000.0;

  const front = vec3.create();
  const right = vec3.create();
  const up = vec3.fromValues(0, 1, 0);
    // Front vector
    vec3.set(front,
      Math.cos(pitch) * Math.cos(yaw),
      Math.sin(pitch),
      Math.cos(pitch) * Math.sin(yaw)
    );
    vec3.normalize(front, front);

    // Right vector
    vec3.cross(right, front, up);
    vec3.normalize(right, right);

    const lookAtTarget = vec3.create();
    vec3.add(lookAtTarget, position, front);
    const viewMatrix = mat4.lookAt(mat4.create(), position, lookAtTarget, up);
  const projectionMatrix = mat4.perspective(mat4.create(), fov, aspectRatio, near, far);

  ecs.attachComponent(cameraEntity, "CameraData", {
    fov: fov,
    aspectRatio: aspectRatio,
    front: front,
    right: right,
    up: up,
    near: near,
    far: far,
    viewMatrix: viewMatrix,
    projectionMatrix: projectionMatrix,
  });

  ecs.attachComponent(cameraEntity, "DirtyFlag", { isDirty: true });

  ecs.attachComponent(cameraEntity, "TargetFollower", {
    targetEntityId: options.targetEntityId ?? -1,
    offset: vec3.create(),
    lerpFactor: 3,
  });

  // 5. 貼上「主相機」標籤
  // ecs.attachComponent(cameraEntity, "MainCameraTag", { isActive: true });

  return cameraEntity;
}
