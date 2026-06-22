import { mat4, vec4 } from "gl-matrix";

type PlaneArray = [vec4, vec4, vec4, vec4, vec4, vec4];

export class Frustum {
  // Each planes is vec4(A, B, C, D), represents Ax + By + Cz + D = 0
  private planes: PlaneArray = [
    vec4.create(), vec4.create(), vec4.create(),
    vec4.create(), vec4.create(), vec4.create(),
  ];

  public update(projectionMatrix: mat4, viewMatrix: mat4) {
    const vpMatrix = mat4.create();
    mat4.multiply(vpMatrix, projectionMatrix, viewMatrix);

    /*
      |           | Column 0 (X軸) | Column 1 (Y軸) | Column 2 (Z軸) | Column 3 (位移/透視) |
      |-----------|---------------|---------------|---------------|------------------|
      | Row 0 (x) | m[0]          | m[4]          | m[8]          | m[12]            |
      | Row 1 (y) | m[1]          | m[5]          | m[9]          | m[13]            |
      | Row 2 (z) | m[2]          | m[6]          | m[10]         | m[14]            |
      | Row 3 (w) | m[3]          | m[7]          | m[11]         | m[15]            |
    */

    // Six planes of frustum
    const m = vpMatrix;

    // Left
    vec4.set(this.planes[0], m[3] + m[0], m[7] + m[4], m[11] + m[8], m[15] + m[12]);
    // Right
    vec4.set(this.planes[1], m[3] - m[0], m[7] - m[4], m[11] - m[8], m[15] - m[12]);
    // Bottom
    vec4.set(this.planes[2], m[3] + m[1], m[7] + m[5], m[11] + m[9], m[15] + m[13]);
    // Top
    vec4.set(this.planes[3], m[3] - m[1], m[7] - m[5], m[11] - m[9], m[15] - m[13]);
    // Near
    vec4.set(this.planes[4], m[3] + m[2], m[7] + m[6], m[11] + m[10], m[15] + m[14]);
    // Far
    vec4.set(this.planes[5], m[3] - m[2], m[7] - m[6], m[11] - m[10], m[15] - m[14]);

    // Normalization 
    // 將所有平面的法向量正規化 (Normalize)
    for (let i = 0; i < 6; i++) {
      const p = this.planes[i] as vec4;
      const length = Math.hypot(p[0], p[1], p[2]);
      vec4.scale(p, p, 1 / length);
    }
  }

  public intersectsAABB(minX: number, minY: number, minZ: number, maxX: number, maxY: number, maxZ: number): boolean {
    for (let i = 0; i < 6; i++) {
      const p = this.planes[i] as vec4;
      // 找出 AABB 在這個平面法向量方向上的最遠點 (Positive Vertex)
      const px = p[0] > 0 ? maxX : minX;
      const py = p[1] > 0 ? maxY : minY;
      const pz = p[2] > 0 ? maxZ : minZ;

      // 如果最遠的點都在平面的「外面」(距離 < 0)，代表整個盒子都在視錐體外
      if (p[0] * px + p[1] * py + p[2] * pz + p[3] < 0) {
        return false; // 剔除！
      }
    }
    return true; // 盒子與視錐體有交集，或者完全在內部
  }
}
