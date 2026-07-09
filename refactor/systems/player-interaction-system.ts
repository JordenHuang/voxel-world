import { vec3 } from "gl-matrix";
import { ECS } from "../ecs";
import { EventBus } from "../event-bus";
import type { System } from "./index";
import {
  ChunkUtils,
  WorldUtils,
  RaycastUtils,
} from "../utils/";

export class PlayerInteractionSystem implements System {
  private ecs: ECS;
  private eventBus: EventBus;

  constructor(ecs: ECS, eventBus: EventBus) {
    this.ecs = ecs;
    this.eventBus = eventBus;
  }

  public update(deltaTime: number) {
    // Player
    const player = this.ecs.queryFirst("MainPlayerTag", "PlayerData", "InputState");
    if (!player) return;

    const playerData = this.ecs.getComponent(player, "PlayerData")!;

    // Input
    const input = this.ecs.getComponent(player, "InputState")!;

    // Camera
    const camera = this.ecs.queryFirst("MainCameraTag", "CameraData", "Position");
    if (!camera) return;

    // getBlockFn
    const camPos = this.ecs.getComponent(camera, "Position")!;
    const camData = this.ecs.getComponent(camera, "CameraData")!;

    const worldInfo = this.ecs.getComponent(playerData.worldId, "WorldInfo")!;
    const worldData = this.ecs.getComponent(playerData.worldId, "WorldData")!;
    const getBlockFn = (x: number, y: number, z: number): number => {
      return WorldUtils.worldGetBlock(this.ecs, worldInfo, worldData, x, y, z);
    };

    const rayResult = RaycastUtils.Raycast.cast(
      camPos.value, 
      camData.front,
      5.0,
      getBlockFn
    );

    if (rayResult.hit) {
      if (rayResult.hitPos && input.mouseLeftClicked) {
        const [x, y, z] = [rayResult.hitPos[0], rayResult.hitPos[1], rayResult.hitPos[2]];
        WorldUtils.worldRemoveBlock(this.ecs, worldData, worldInfo, x, y, z);
      } else if (rayResult.prevPos && input.mouseRightClicked) {
        const [x, y, z] = [rayResult.prevPos[0], rayResult.prevPos[1], rayResult.prevPos[2]];
        WorldUtils.worldSetBlock(this.ecs, worldData, worldInfo, x, y, z, 1);
      }

      // // 4. 🌟 使用 Defer 系統進行結構性改變！
      // // 找到被打中的那個 Chunk 實體
      // const targetChunkEntity = this.chunkManager.getChunkEntityByPos(rayResult.hitPos);
      //
      // if (targetChunkEntity) {
      //   // 不要直接在這裡改陣列，送出指令，讓排程器在 Phase 結束時統一處理
      //   cmd.deferBlockDestruction(targetChunkEntity, rayResult.blockLocalPos);
      //
      //   // 順便貼上 DirtyFlag 讓 MeshBuilder 知道要重構網格
      //   cmd.deferAttach(targetChunkEntity, "DirtyFlag", { isDirty: true });
    }
  }
}

