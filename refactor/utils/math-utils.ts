import { vec3 } from "gl-matrix";
import type { DirectionVectors } from "../types/rotation.ts";
import type { Rotation } from "../components";

export function getDirectionVectors(rot: Rotation): DirectionVectors {
  const front = vec3.create();
  front[0] = Math.cos(rot.yaw);
  front[1] = 0
  front[2] = Math.sin(rot.yaw);
  vec3.normalize(front, front);

  const right = vec3.create();
  const worldUp = vec3.fromValues(0, 1, 0);
  vec3.cross(right, front, worldUp);
  vec3.normalize(right, right);

  const up = vec3.create();
  vec3.cross(up, right, front);
  vec3.normalize(up, up);

  return { front, right, up };
}
