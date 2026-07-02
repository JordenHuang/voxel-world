export class SlidingFpsAverage {
  private readonly buffer: number[];
  private readonly windowSize: number;

  private index = 0;
  private count = 0;
  private sum = 0;

  constructor(windowSize = 100) {
    this.windowSize = windowSize;
    this.buffer = new Array(windowSize).fill(0);
  }

  add(fps: number): void {
    if (this.count < this.windowSize) {
      this.buffer[this.index] = fps;
      this.sum += fps;
      this.count++;
    } else {
      this.sum -= this.buffer[this.index];
      this.buffer[this.index] = fps;
      this.sum += fps;
    }

    this.index = (this.index + 1) % this.windowSize;
  }

  getAverage(): number {
    return this.count === 0 ? 0 : this.sum / this.count;
  }

  clear(): void {
    this.buffer.fill(0);
    this.index = 0;
    this.count = 0;
    this.sum = 0;
  }
}
