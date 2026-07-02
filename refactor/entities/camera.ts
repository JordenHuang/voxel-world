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
  isMainCamera?: boolean;
}

export function createCamera(ecs: ECS, options: CameraOptions = {}): Entity {
  const cameraEntity = ecs.createEntity();

  ecs.attachComponent(cameraEntity, "CameraTag", {});

  if (options.isMainCamera) {
    ecs.attachComponent(cameraEntity, "MainCameraTag", {});
  }

  ecs.attachComponent(cameraEntity, "Position", {
    value: options.position?.value ?? vec3.fromValues(0, 0, 0),
  });

  ecs.attachComponent(cameraEntity, "Rotation", {
    pitch: options.rotation?.pitch ?? 0,
    yaw:   options.rotation?.yaw   ?? -Math.PI / 2,
    roll:  options.rotation?.roll  ?? 0,
  });

  ecs.attachComponent(cameraEntity, "CameraData", {
    fov: options.fov ?? (45 * Math.PI) / 180,
    aspectRatio: options.aspectRatio ?? 800 / 600,
    near: options.near ?? 0.1,
    far: options.far ?? 256.0,

    front: vec3.fromValues(0, 0, -1),
    right: vec3.fromValues(1, 0, 0),
    up: vec3.fromValues(0, 1, 0),

    viewMatrix: mat4.create(),
    projectionMatrix: mat4.create(),
  });

  ecs.attachComponent(cameraEntity, "DirtyFlag", { isDirty: true });

  if (options.targetEntityId !== undefined) {
    ecs.attachComponent(cameraEntity, "TargetFollower", {
      targetEntityId: options.targetEntityId,
      offset: vec3.create(),
      lerpFactor: 3,
    });
  }

  return cameraEntity;
}
