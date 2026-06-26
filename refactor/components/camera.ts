import { mat4, vec3 } from "gl-matrix";
import type { Entity } from "../entities/entity";

export interface CameraData {
  fov: number;
  aspectRatio: number;
  front: vec3;
  right: vec3;
  up: vec3;
  near: number;
  far: number;
  viewMatrix: mat4;
  projectionMatrix: mat4;
  isViewDirty: boolean;
}

export interface TargetFollower {
  targetEntityId: Entity;
  offsetX: number;
  offsetY: number;
  offsetZ: number;
  lerpFactor: number;  // Value between 0 ~ 1
}
