import { vec3 } from "gl-matrix";
import { ECS } from "../ecs";
import { EventBus } from "../event-bus";
import type { System } from "./index";
import { MathUtils } from "../utils/";

export class PlayerControlSystem implements System {
  private ecs: ECS;
  private eventBus: EventBus;

  constructor(ecs: ECS, eventBus: EventBus) {
    this.ecs = ecs;
    this.eventBus = eventBus;

    this.setupEventSubscriptions();
  }

  private setupEventSubscriptions() {}

  public update(deltaTime: number) {
    const players = this.ecs.query("PlayerTag", "Rotation", "Velocity", "InputState", "PlayerData");
    const moveDir = vec3.create();

    for (const player of players) {
      // TODO: Make movementSpeed and mouseSensitivity configuable
      let movementSpeed = 0.008;
      const mouseSensitivity = 0.002
      vec3.set(moveDir, 0, 0, 0);

      const rot = this.ecs.getComponent(player, "Rotation")!;
      const vel = this.ecs.getComponent(player, "Velocity")!;
      const input = this.ecs.getComponent(player, "InputState")!;
      const playerData = this.ecs.getComponent(player, "PlayerData")!;

      // Update Player rotation
      rot.yaw += input.deltaX * mouseSensitivity;
      rot.pitch += input.deltaY * mouseSensitivity * -1;
      // Limit yaw angle to avoid gimbal lock
      const pitchLimit = 89.9 * Math.PI / 180; // 89.9 degree
      rot.pitch = Math.max(Math.min(rot.pitch, pitchLimit), -pitchLimit);

      // Calculate move direction base on input
      const dv = MathUtils.getDirectionVectors(rot);
      const front = dv.front;
      const right = dv.right;
      const up    = dv.up;

      if (input.moveForward) {
        vec3.add(moveDir, moveDir, front);
      }
      if (input.moveBackward) {
        vec3.sub(moveDir, moveDir, front);
      }
      if (input.moveLeft) {
        vec3.sub(moveDir, moveDir, right);
      }
      if (input.moveRight) {
        vec3.add(moveDir, moveDir, right);
      }

      // Lock Y-axis movement
      moveDir[1] = 0;

      if (input.sprint) {
        movementSpeed *= 3;
      }

      if (input.jump && (playerData.isOnTheGround || input.sprint)) {
        vec3.add(moveDir, moveDir, up);
        vel.value[1] = 0.9 * movementSpeed;
        playerData.isOnTheGround = false;
      }
      if (input.sneak/*  && !playerData.isOnTheGround*/) {
        vel.value[1] = -2.0 * movementSpeed;
        vec3.sub(moveDir, moveDir, up);
      }

      vec3.normalize(moveDir, moveDir);

      // Update velocity value
      // vec3.scale(vel.value, moveDir, movementSpeed);
      vel.value[0] = moveDir[0] * movementSpeed;
      vel.value[2] = moveDir[2] * movementSpeed;

      // TODO: Remove it when reset key is not needed
      if (input.reset) {
        const pos = this.ecs.getComponent(player, "Position");
        if (pos) vec3.set(pos.value, 0, 100, 0);
        rot.pitch = 0;
        rot.yaw   = -Math.PI / 2;
        rot.roll  = 0;
        vec3.set(vel.value, 0, 0, 0);
      }

    }
  }
}

