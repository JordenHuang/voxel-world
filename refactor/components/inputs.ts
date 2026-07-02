export interface InputState {
  moveForward: boolean;
  moveBackward: boolean;
  moveLeft: boolean;
  moveRight: boolean;
  jump: boolean;
  sneak: boolean;
  sprint: boolean;
  reset: boolean;
  deltaX: number;
  deltaY: number;
}

export interface InputMap {
  forwardKey: string;
  backwardKey: string;
  leftKey: string;
  rightKey: string;
  jumpKey: string;
  sneakKey: string;
  sprintKey: string;
  resetKey: string;
}
