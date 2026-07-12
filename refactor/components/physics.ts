import { vec3 } from "gl-matrix";

export interface Velocity {
  value: vec3;
}

export interface AABB {
  halfWidth: number;
  halfHeight: number;
  halfDepth: number;
}
