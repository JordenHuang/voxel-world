import type { Position, Rotation } from "./transforms";
import type { CameraData, TargetFollower } from "./camera";
import type { CameraTag, MainCameraTag, PlayerTag } from "./tags";
import type { InputState, InputMap } from "./inputs";
import type { Renderable } from "./renderable";

export interface ComponentMap {
  Position: Position;
  Rotation: Rotation;

  CameraData: CameraData;
  TargetFollower: TargetFollower;

  CameraTag: CameraTag;
  MainCameraTag: MainCameraTag;
  PlayerTag: PlayerTag;

  InputState: InputState;
  InputMap: InputMap;

  Renderable: Renderable;
};

export type ComponentName = keyof ComponentMap;

export type * from "./camera";
export type * from "./inputs";
export type * from "./tags";
export type * from "./transforms";
export type * from "./renderable";
