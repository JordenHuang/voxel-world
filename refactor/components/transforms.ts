import { vec3 } from "gl-matrix";

// [ x, y, z ]
export type Position = vec3;

// [ roll, pitch, yaw ]
export interface Rotation {
  pitch: number;
  yaw: number;
  roll: number;
}
