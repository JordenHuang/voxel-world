import { Camera } from "./camera";
import { vec3 } from "gl-matrix";
import { InputManager } from "./input-manager";

export class Player {
  public position: vec3;
  public camera: Camera;
  public near: number = 0.1;
  public far: number = 256.0;

  private moveDir: vec3;
  private movementSpeed: number = 0.015;
  private mouseSpeed: number = 0.003;

  constructor(aspectRatio: number) {
    this.position = vec3.fromValues(0, 0, 0);
    this.camera = new Camera(this.near, this.far, aspectRatio);
    this.moveDir = vec3.create();
  }

  public update(deltaTime: number, input: InputManager) {

    // 1. 處理視角旋轉
    this.camera.processMouseMovement(input.mouseDeltaX, input.mouseDeltaY, this.mouseSpeed);

    this.handleKeys(deltaTime, input);

    this.camera.updateFrustum();
  }

  private handleKeys(deltaTime: number, input: InputManager) {
    let movementSpeed = this.movementSpeed;
    // 2. 處理 WASD 移動向量計算
    vec3.set(this.moveDir, 0, 0, 0); // 清空上一幀

    if (input.isKeyDown("KeyW") || input.isKeyDown("ArrowUp")) {
      vec3.add(this.moveDir, this.moveDir, this.camera.getFront());
    }
    if (input.isKeyDown("KeyS") || input.isKeyDown("ArrowDown")) {
      vec3.sub(this.moveDir, this.moveDir, this.camera.getFront());
    }
    if (input.isKeyDown("KeyA") || input.isKeyDown("ArrowLeft")) {
      vec3.sub(this.moveDir, this.moveDir, this.camera.getRight());
    }
    if (input.isKeyDown("KeyD") || input.isKeyDown("ArrowRight")) {
      vec3.add(this.moveDir, this.moveDir, this.camera.getRight());
    }

    // Lock Y-axis movement
    this.moveDir[1] = 0;

    if (input.isKeyDown("Space")) {
      vec3.add(this.moveDir, this.moveDir, this.camera.getUp());
    }
    if (input.isKeyDown("ShiftLeft")) {
      vec3.sub(this.moveDir, this.moveDir, this.camera.getUp());
    }
    if (input.isKeyDown("ControlLeft")) {
      movementSpeed *= 5;
    }

    if (input.isKeyDown("KeyR")) {
      vec3.set(this.position, 0, 0, 0);
      this.camera.yaw = -Math.PI / 2;
      this.camera.pitch = 0;
    }

    vec3.normalize(this.moveDir, this.moveDir);

    // // 處理跳躍跳躍 (空白鍵)
    // if (input.isKeyDown(' ')) {
    //   // 這裡未來可以加入跳躍物理: this.velocity[1] = jumpForce;
    // }

    // 3. 實際應用位移量
    vec3.scale(this.moveDir, this.moveDir, movementSpeed * deltaTime);
    vec3.add(this.position, this.position, this.moveDir);

    // 4. 同步讓相機的位置跟著玩家身體走
    vec3.copy(this.camera.position, this.position);
  }
}
