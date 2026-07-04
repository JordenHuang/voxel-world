export interface System {
  update(deltaTime: number): void;
  dispose?(): void;
}

