import { ECS } from "../ecs";
import { EventBus } from "../event-bus";
import type { System } from "./index";

// TODO: Add enum for mouse buttons

export class InputSystem implements System {
  private ecs: ECS;
  private eventBus: EventBus;

  private keys: { [key: string]: boolean } = {};

  private mouse: Record<string, boolean> = {};
  private previousMouse: Record<string, boolean> = {};

  public pmouseX: number = 0;
  public pmouseY: number = 0;
  public mouseX: number = 0;
  public mouseY: number = 0;
  public mouseDeltaX: number = 0;
  public mouseDeltaY: number = 0;

  constructor(ecs: ECS, eventBus: EventBus) {
    this.ecs = ecs;
    this.eventBus = eventBus;

    this.setupEventListeners();
    this.setupSubscriptions();
  }

  private setupSubscriptions() {
    // this.eventBus.on("MOUSE_MOVED", (data) => this.handleMouseMovement(data.deltaX, data.deltaY));
  }

  private setupEventListeners() {
    // https://stackoverflow.com/questions/24764626/any-way-to-prevent-disable-ctrl-key-shortcuts-in-the-browser
    window.addEventListener("onbeforeunload", (e) => {
      e.preventDefault();
      e.stopPropagation();
    });

    window.addEventListener("keydown", (e) => {
      this.keys[e.code] = true;

      if (!e.ctrlKey) return;

      const ignoredKeys = ["KeyW", "KeyA", "KeyS", "KeyD"];
      if (ignoredKeys.includes(e.code)) {
        e.preventDefault();
        e.stopPropagation();
      }
    });
    window.addEventListener("keyup", (e) => this.keys[e.code] = false);

    // 監聽滑鼠移動 (當 Pointer Lock 啟動時)
    window.addEventListener("mousemove", (e) => {
      if (this.isPointerLocked()) {
        // When cursor locked
        this.mouseDeltaX += e.movementX;
        this.mouseDeltaY += e.movementY;
      }
      else {
        // When cursor not locked
        this.pmouseX = this.mouseX;
        this.pmouseY = this.mouseY;
        this.mouseX = e.clientX;
        this.mouseY = e.clientY;

        if (Math.abs(this.mouseX - this.pmouseX) > 100) this.pmouseX = this.mouseX;
        if (Math.abs(this.mouseY - this.pmouseY) > 100) this.pmouseY = this.mouseY;

        this.mouseDeltaX = this.mouseX - this.pmouseX;
        this.mouseDeltaY = this.mouseY - this.pmouseY;
      }
    });

    window.addEventListener("mousedown", (e) => {
      this.mouse[e.button] = true;
    });

    window.addEventListener("mouseup", (e) => {
      this.mouse[e.button] = false;
    });
  }

  private handleMouseMovement(deltaX: number, deltaY: number) {
    const sensitivity = 0.002;
    // 假設玩家擁有一個特定的 Tag，例如 "MainCameraTag" 或 "PlayerController"
    const playerEntities = this.ecs.query("MainCameraTag");

    for (const entity of playerEntities) {
      const rot = this.ecs.getComponent(entity, "Rotation")!;
      const camData = this.ecs.getComponent(entity, "CameraData");
      const camDirtyFlag = this.ecs.getComponent(entity, "DirtyFlag");

    // Limit yaw angle to avoid gimbal lock
      rot.yaw += deltaX * sensitivity;
      rot.pitch += deltaY * sensitivity * -1;

      const pitchLimit = 89.9 * Math.PI / 180;  // 89.9 degree
      rot.pitch = Math.max(Math.min(rot.pitch, pitchLimit), -pitchLimit);

      // ⚠️ 關鍵：標記相機資料為 "Dirty" (髒資料，需要重新計算矩陣)
      if (camDirtyFlag) {
        camDirtyFlag.isDirty = true;
      }
    }
  }

  private isPointerLocked(): boolean {
    return !!document.pointerLockElement;
  }

  private isFullScreen(): boolean {
    return !!document.fullscreenElement;
  }

  public isKeyDown(key: string): boolean {
    return !!this.keys[key];
  }

  public isButtonDown(btn: string): boolean {
    return !!this.mouse[btn];
  }

  public isButtonUp(btn: string): boolean {
    return this.mouse[btn] === false;
  }

  public isButtonPressed(btn: string | number): boolean {
    const isDownNow = !!this.mouse[btn];
    const wasDownBefore = !!this.previousMouse[btn];
    // 這一幀按著，且上一幀沒按，才算觸發！
    return isDownNow && !wasDownBefore;
  }

  // 3. 觸發判定：單次放開 (可選，有時候用來做蓄力攻擊)
  public isButtonReleased(btn: string | number): boolean {
    const isDownNow = !!this.mouse[btn];
    const wasDownBefore = !!this.previousMouse[btn];
    return !isDownNow && wasDownBefore;
  }

  public clearFrameData() {
    this.mouseDeltaX = 0;
    this.mouseDeltaY = 0;

    this.previousMouse = { ...this.mouse };
  }

  public update(deltaTime: number) {
    const entities = this.ecs.query("InputMap", "InputState");

    for (const entity of entities) {
      const state = this.ecs.getComponent(entity, "InputState")!;
      const keymap = this.ecs.getComponent(entity, "InputMap")!;

      // 將硬體按鍵對應到「語意化」的資料
      state.moveForward = this.isKeyDown(keymap.forwardKey);
      state.moveBackward = this.isKeyDown(keymap.backwardKey);
      state.moveLeft = this.isKeyDown(keymap.leftKey);
      state.moveRight = this.isKeyDown(keymap.rightKey);
      state.jump = this.isKeyDown(keymap.jumpKey);
      state.sneak = this.isKeyDown(keymap.sneakKey);
      state.sprint = this.isKeyDown(keymap.sprintKey);
      state.reset = this.isKeyDown(keymap.resetKey);
      state.deltaX = this.mouseDeltaX;
      state.deltaY = this.mouseDeltaY;
    }
  }
}
