export class InputManager {
  private keys: { [key: string]: boolean } = {};
  public pmouseX: number = 0;
  public pmouseY: number = 0;
  public mouseX: number = 0;
  public mouseY: number = 0;
  public mouseDeltaX: number = 0;
  public mouseDeltaY: number = 0;
  public isLeftMouseClicked: boolean = false;

  constructor(canvas: HTMLCanvasElement) {
    // 監聽鍵盤
    window.addEventListener("keydown", (e) => this.keys[e.code] = true);
    window.addEventListener("keyup", (e) => this.keys[e.code] = false);

    // 監聽滑鼠移動 (當 Pointer Lock 啟動時)
    window.addEventListener("mousemove", (e) => {
      if (document.pointerLockElement === canvas) {
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

    // 點擊 Canvas 啟動 Pointer Lock
    canvas.addEventListener("click", () => canvas.requestPointerLock());
  }

  // 提供一個簡單的方法檢查某個鍵是否被按下
  public isKeyDown(key: string): boolean {
    return !!this.keys[key];
  }

  // 每幀結束時，需要清空滑鼠位移量，否則沒移滑鼠時鏡頭還會繼續轉
  public clearFrameData() {
    this.mouseDeltaX = 0;
    this.mouseDeltaY = 0;
    this.isLeftMouseClicked = false;
  }
}
