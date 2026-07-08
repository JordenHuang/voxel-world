import { ECS } from "./ecs";
import type { System } from "./systems";
// import { CommandBuffer } from "./command-buffer";

export enum Phase {
  PreUpdate,
  OnUpdate,
  PostUpdate,
}

export class SystemScheduler {
  private ecs: ECS;
  // private commandBuffer = new CommandBuffer();

  // 使用 Map 來儲存不同 Phase 的系統陣列
  private phasedSystems: Map<Phase, System[]> = new Map();

  constructor(ecs: ECS) {
    this.ecs = ecs;

    for (const phase in Phase) {
      if (!isNaN(Number(phase))) {
        this.phasedSystems.set(Number(phase) as Phase, []);
      }
    }
  }

  public addSystem(phase: Phase, system: System) {
    this.phasedSystems.get(phase)!.push(system);
  }

  public tick(deltaTime: number) {
    // 嚴格按照順序執行各個階段
    this.runPhase(Phase.PreUpdate, deltaTime);
    this.runPhase(Phase.OnUpdate, deltaTime);
    this.runPhase(Phase.PostUpdate, deltaTime);
  }

  private runPhase(phase: Phase, deltaTime: number) {
    const systems = this.phasedSystems.get(phase)!;

    for (const sys of systems) {
      sys.update(deltaTime); 
    }
  }
}
