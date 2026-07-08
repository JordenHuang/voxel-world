import { ECS } from "../ecs";

export interface RenderPass {
  execute(ecs: ECS): void;
}
