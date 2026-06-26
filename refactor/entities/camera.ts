import { mat4, vec3 } from "gl-matrix";

import { ECS } from "../ecs";
import type { Entity } from "./entity";
import type { Position } from "../components/";
import type { Rotation } from "../components/";
import type { CameraData } from "../components/";
import type { TargetFollower } from "../components/";
import type { CameraTag } from "../components/";

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

  ecs.attachComponent(cameraEntity, "Position", {
    x: options.position?.x ?? 0,
    y: options.position?.y ?? 5,
    z: options.position?.z ?? 20,
  });

  ecs.attachComponent(cameraEntity, "Rotation", {
    pitch: options.rotation?.pitch ?? 0,
    yaw: options.rotation?.yaw ?? -Math.PI / 2,
    roll: options.rotation?.roll ?? 0,
  });

  ecs.attachComponent(cameraEntity, "CameraData", {
    fov: options.fov ?? (45 * Math.PI) / 180,
    aspectRatio: options.aspectRatio ?? 800 / 600,
    front: vec3.create(),
    right: vec3.create(),
    up: vec3.fromValues(0, 1, 0),
    near: options.near ?? 0.1,
    far: options.far ?? 1000.0,
    viewMatrix: mat4.create(),
    projectionMatrix: mat4.create(),
    isViewDirty: true,
  });

  ecs.attachComponent(cameraEntity, "TargetFollower", {
    targetEntityId: options.targetEntityId ?? -1,
    offsetX: 0,
    offsetY: 0,
    offsetZ: 0,
    lerpFactor: 0.1,
  });

  // 5. 貼上「主相機」標籤
  // ecs.attachComponent(cameraEntity, "MainCameraTag", { isActive: true });

  return cameraEntity;
}
