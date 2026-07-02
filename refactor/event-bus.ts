export type Events = {
  "MOUSE_MOVED": { deltaX: number, deltaY: number };
  "UPDATE_ASPECT_RATIO": { width: number, height: number };

  //
  "BLOCK_CHANGED": { x: number, y: number, z: number, newId: number };
  "CHUNK_DIRTY": { chunkX: number, chunkZ: number };
  "MESH_GENERATED": { chunkX: number, chunkZ: number, vertices: Float32Array, indices: Uint32Array };
  "CHUNK_UNLOADED": { chunkX: number, chunkZ: number };
};

type EventCallback<T> = (data: T) => void;

export class EventBus {
  private listeners: { [K in keyof Events]?: EventCallback<Events[K]>[] } = {};

  public on<K extends keyof Events>(event: K, callback: EventCallback<Events[K]>) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event]!.push(callback);
  }

  public emit<K extends keyof Events>(event: K, data: Events[K]) {
    const callbacks = this.listeners[event];
    if (callbacks) {
      for (const callback of callbacks) {
        callback(data);
      }
    }
  }
}

export const engineBus = new EventBus();
