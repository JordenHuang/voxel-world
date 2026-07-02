import { vec3 } from "gl-matrix";

export interface Position {
  value: vec3;  // [ x, y, z ]
}

// [ roll, pitch, yaw ]
export interface Rotation {
  pitch: number;
  yaw: number;
  roll: number;
}
