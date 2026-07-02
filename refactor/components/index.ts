import type { Position, Rotation } from "./transforms";
import type { CameraData, TargetFollower } from "./camera";
import type { CameraTag, MainCameraTag, PlayerTag } from "./tags";
import type { DirtyFlag} from "./flags";
import type { InputState, InputMap } from "./inputs";
import type { Renderable } from "./renderable";
import type { ChunkData } from "./chunk";
import type { WorldInfo, WorldData } from "./world";

export interface ComponentMap {
  Position: Position;
  Rotation: Rotation;

  CameraData: CameraData;
  TargetFollower: TargetFollower;

  CameraTag: CameraTag;
  MainCameraTag: MainCameraTag;
  PlayerTag: PlayerTag;

  DirtyFlag: DirtyFlag;

  InputState: InputState;
  InputMap: InputMap;

  Renderable: Renderable;
  ChunkData: ChunkData;
  WorldInfo: WorldInfo;
  WorldData: WorldData;
};

export type ComponentName = keyof ComponentMap;

export type * from "./camera";
export type * from "./inputs";
export type * from "./tags";
export type * from "./flags";
export type * from "./transforms";
export type * from "./renderable";
export type * from "./chunk";
export type * from "./world";
