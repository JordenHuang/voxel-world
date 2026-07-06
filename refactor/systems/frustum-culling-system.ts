import { vec4 } from "gl-matrix";
import { ECS } from "../ecs";
import { EventBus } from "../event-bus";
import type { System } from "./index";

export class FrustumCullingSystem implements System {
  private ecs: ECS;
  private eventBus: EventBus;

  constructor(ecs: ECS, eventBus: EventBus) {
    this.ecs = ecs;
    this.eventBus = eventBus;
  }

  private checkAABBFrustumIntersection(minX: number, minY: number, minZ: number, maxX: number, maxY: number, maxZ: number, planes: vec4[]): boolean {
    for (let i = 0; i < 6; i++) {
      const p = planes[i] as vec4;
      const px = p[0] > 0 ? maxX : minX;
      const py = p[1] > 0 ? maxY : minY;
      const pz = p[2] > 0 ? maxZ : minZ;

      if (p[0] * px + p[1] * py + p[2] * pz + p[3] < 0) {
        return false;
      }
    }
    return true;
  }

  public update(deltaTime: number) {
    const mainCamera = this.ecs.queryFirst("MainCameraTag", "CameraData");
    if (!mainCamera) return;

    const camData = this.ecs.getComponent(mainCamera, "CameraData")!;

    const renderables = this.ecs.query("Renderable", "VolumeBoundary");

    for (const entity of renderables) {
      const boundary = this.ecs.getComponent(entity, "VolumeBoundary")!;
      const minX = boundary.boundaryMin[0];
      const minY = boundary.boundaryMin[1];
      const minZ = boundary.boundaryMin[2];
      const maxX = boundary.boundaryMax[0];
      const maxY = boundary.boundaryMax[1];
      const maxZ = boundary.boundaryMax[2];

      // AABB intersection test
      const inFrustum = this.checkAABBFrustumIntersection(
        minX, minY, minZ, maxX, maxY, maxZ, camData.frustumPlanes
      );

      // Add or remove tag dynamically
      if (inFrustum) {
        this.ecs.attachComponent(entity, "VisibleInFrustumTag", {});
      } else {
        this.ecs.removeComponent(entity, "VisibleInFrustumTag");
      }
    }
  }
}
