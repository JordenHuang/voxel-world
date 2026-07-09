import { vec3 } from "gl-matrix";
import { ECS } from "../ecs";
import type { Entity } from "./entity";
import type { Position, Rotation } from "../components/";

export interface PlayerOptions {
  isMainPlayer: boolean;
  worldId: Entity;
  position?: Position;
  rotation?: Rotation;
  name?: string;
}

export function createPlayer(ecs: ECS, options: PlayerOptions): Entity {
  const playerEntity = ecs.createEntity();

  ecs.attachComponent(playerEntity, "PlayerTag", {});

  if (options.isMainPlayer)
    ecs.attachComponent(playerEntity, "MainPlayerTag", {});

  ecs.attachComponent(playerEntity, "PlayerData", {
    worldId: options.worldId,
    name: options.name ?? "Guest",
  });

  ecs.attachComponent(playerEntity, "Position", {
    value: options.position?.value ?? vec3.fromValues(0, 0, 0),
  });

  ecs.attachComponent(playerEntity, "Rotation", {
    pitch: options.rotation?.pitch ?? 0,
    yaw:   options.rotation?.yaw   ?? -Math.PI / 2,
    roll:  options.rotation?.roll  ?? 0,
  });

  ecs.attachComponent(playerEntity, "Velocity", {
    value: vec3.create(),
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
