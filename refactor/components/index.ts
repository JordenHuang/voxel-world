import type { Position, Rotation, VolumeBoundary } from "./transforms";
import type { Velocity } from "./physics";
import type { PlayerData } from "./player";
import type { CameraData, TargetFollower } from "./camera";
import type {
  CameraTag, MainCameraTag,
  PlayerTag, MainPlayerTag,
  VisibleInFrustumTag,
  ChunkTag,
  WOverworldTag,
  WNetherTag,
  WTheEndTag,
  NeedsGenerationTag,
} from "./tags";
import type { DirtyFlag} from "./flags";
import type { InputState, InputMap } from "./inputs";
import type { Renderable } from "./renderable";
import type { ChunkData } from "./chunk";
import type { WorldInfo, WorldData } from "./world";

export interface ComponentMap {
  // Transforms
  Position: Position;
  Rotation: Rotation;
  VolumeBoundary: VolumeBoundary;

  Velocity: Velocity;

  // Player
  PlayerData: PlayerData;

  // Camera
  CameraData: CameraData;
  TargetFollower: TargetFollower;

  // Tags
  CameraTag: CameraTag;
  MainCameraTag: MainCameraTag;
  PlayerTag: PlayerTag;
  MainPlayerTag: MainPlayerTag;
  VisibleInFrustumTag: VisibleInFrustumTag;
  ChunkTag: ChunkTag;
  WOverworldTag: WOverworldTag;
  WNetherTag: WNetherTag;
  WTheEndTag: WTheEndTag;
  NeedsGenerationTag: NeedsGenerationTag;

  // Flags
  DirtyFlag: DirtyFlag;

  // Inputs
  InputState: InputState;
  InputMap: InputMap;

  // Renderable
  Renderable: Renderable;

  // Chunk
  ChunkData: ChunkData;

  // World
  WorldInfo: WorldInfo;
  WorldData: WorldData;
};

export type ComponentName = keyof ComponentMap;

export type * from "./player";
export type * from "./camera";
export type * from "./chunk";
export type * from "./flags";
export type * from "./inputs";
export type * from "./physics";
export type * from "./renderable";
export type * from "./tags";
export type * from "./transforms";
export type * from "./world";
