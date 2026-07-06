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

export interface VolumeBoundary {
  boundaryMin: vec3; // min [ x, y, z ]
  boundaryMax: vec3; // max [ x, y, z ]
}
