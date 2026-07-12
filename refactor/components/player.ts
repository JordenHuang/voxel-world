import type { Entity } from "../entities/entity";
import type { RaycastUtils } from "../utils/";

export interface PlayerData {
  name: string;
  worldId: Entity;
  isOnTheGround: boolean;
}

export interface PlayerLookAt {
  rayResult: RaycastUtils.RaycastResult;
}
