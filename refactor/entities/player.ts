import { mat4, vec3 } from "gl-matrix";

import { ECS } from "../ecs";
import type { Entity } from "./entity";
import type { Position } from "../components/";
import type { Rotation } from "../components/";

export interface PlayerOptions {
  position?: Position;
  rotation?: Rotation;
}

export function createPlayer(ecs: ECS, options: PlayerOptions = {}): Entity {
  const playerEntity = ecs.createEntity();

  ecs.attachComponent(playerEntity, "PlayerTag", {});

  ecs.attachComponent(playerEntity, "Position", options.position ?? vec3.fromValues(0, 0, 0));

  ecs.attachComponent(playerEntity, "Rotation", {
    pitch: options.rotation?.pitch ?? 0,
    yaw: options.rotation?.yaw ?? -Math.PI / 2,
    roll: options.rotation?.roll ?? 0,
  });

  ecs.attachComponent(playerEntity, "InputMap", {
    forwardKey: "KeyW",
    backwardKey: "KeyS",
    leftKey: "KeyA",
    rightKey: "KeyD",
    jumpKey: "Space",
    sneakKey: "ShiftLeft",
    sprintKey: "ControlLeft",
    resetKey: "KeyR",
  });

  ecs.attachComponent(playerEntity, "InputState", {
    moveForward: false,
    moveBackward: false,
    moveLeft: false,
    moveRight: false,
    jump: false,
    sneak: false,
    sprint: false,
    reset: false,
    deltaX: 0,
    deltaY: 0,
  });

  return playerEntity;
}
