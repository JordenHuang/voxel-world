import { mat4, vec3 } from "gl-matrix";
import { Frustum } from "./frustum";

export class Camera {
  public position: vec3;
  public yaw: number = -Math.PI / 2; // horizontal angle (up and down)(left turn 90 degrees)
  public pitch: number = 0; // vertical angle (left and right), face -z initially (North)

  public frustum: Frustum;

  private front: vec3;
  private right: vec3;
  private up: vec3;
  private viewMatrix: mat4;
  private projectionMatrix: mat4;
  private FoV: number;

  constructor(near: number=0.1, far: number=1000.0, aspectRatio: number) {
    this.position = vec3.fromValues(0, 5, 20);
    this.front = vec3.create();
    this.right = vec3.create();
    this.up = vec3.fromValues(0, 1, 0); // Up is positive Y-axis
    this.FoV = 45 * Math.PI / 180;

    this.viewMatrix = mat4.create();
    this.projectionMatrix = mat4.create();

    this.frustum = new Frustum();

    // 建立透視投影矩陣
    this.updateProjectionMatrix(near, far, aspectRatio);

    this.updateViewMatrix();

    // 初始化計算方向向量
    this.updateVectors();

    this.updateFrustum();
  }

  public processMouseMovement(deltaX: number, deltaY: number, sensitivity: number = 0.002) {
    this.yaw += deltaX * sensitivity;
    this.pitch += deltaY * sensitivity * -1;

    // Limit yaw angle to avoid gimbal lock
    const pitchLimit = 89.9 * Math.PI / 180; // 89.9 degree
    this.pitch = Math.max(Math.min(this.pitch, pitchLimit), -pitchLimit)
    this.updateVectors();
  }

  public updateFrustum() {
    this.updateVectors();
    this.updateViewMatrix();
    this.frustum.update(this.projectionMatrix, this.viewMatrix);
  }

  private updateVectors() {
    // Front vector
    vec3.set(this.front,
      Math.cos(this.pitch) * Math.cos(this.yaw),
      Math.sin(this.pitch),
      Math.cos(this.pitch) * Math.sin(this.yaw)
    );
    vec3.normalize(this.front, this.front);

    // Right vector
    vec3.cross(this.right, this.front, this.up);
    vec3.normalize(this.right, this.right);
  }

  public getFront(): vec3 { return this.front; }
  public getRight(): vec3 { return this.right; }
  public getUp(): vec3 { return this.up; }

  public getViewMatrix(): mat4 {
    return this.viewMatrix;
  }

  public getProjectionMatrix(): mat4 {
    return this.projectionMatrix;
  }

  public updateViewMatrix() {
    const lookAtTarget = vec3.create();
    vec3.add(lookAtTarget, this.position, this.front);
    mat4.lookAt(this.viewMatrix, this.position, lookAtTarget, this.up);
  }

  public updateProjectionMatrix(near: number=0.1, far: number=1000.0, aspectRatio: number) {
    mat4.perspective(this.projectionMatrix, this.FoV, aspectRatio, near, far);
  };
}
