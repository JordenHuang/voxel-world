export class InputManager {
  private keys: { [key: string]: boolean } = {};
  public pmouseX: number = 0;
  public pmouseY: number = 0;
  public mouseX: number = 0;
  public mouseY: number = 0;
  public mouseDeltaX: number = 0;
  public mouseDeltaY: number = 0;
  public isLeftMouseClicked: boolean = false;
  private canvas: HTMLCanvasElement;

  constructor(canvas: HTMLCanvasElement, resizeCallback: Function) {
    this.canvas = canvas;

    // 監聽鍵盤
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
      if (this.isPointerLocked() || document.fullscreenEnabled === true) {
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
    canvas.addEventListener("click", async () => {
      try {
        if (!document.fullscreenElement)
          await canvas.requestFullscreen();
        if (!this.isPointerLocked())
          await canvas.requestPointerLock();
      } catch (error) {
        console.error("Unable to enter fullscreen mode:", error);
      }
    });

    window.addEventListener("resize", () => {
      if (document.fullscreenElement) {
        resizeCallback("fullscreen");
      } else {
        resizeCallback("default");
      }
    });
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

  public isPointerLocked(): boolean {
    return document.pointerLockElement === this.canvas;
  }
}
