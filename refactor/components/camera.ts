import { mat4, vec4, vec3 } from "gl-matrix";
import type { Entity } from "../entities/entity";
import type { FrustumPlaneArray } from "../types/camera";

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
  frustumPlanes: FrustumPlaneArray;
}

export interface TargetFollower {
  targetEntityId: Entity;
  offset: vec3; // [ x, y, z ]
  lerpFactor: number;  // Value between 0 ~ 1
}
