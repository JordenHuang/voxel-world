#version 300 es
precision mediump float;

in vec3 aVertexPosition;
in vec4 aVertexColor;
in vec2 aTextureCoord;

uniform mat4 uModelViewMatrix;
uniform mat4 uProjectionMatrix;

out highp vec2 vTextureCoord;

out vec3 voxelColor;

in lowp vec4 vColor;


// ===
vec3 hash_(vec3 co) {
    // 1. 利用不同的無理數對 3 個維度產生初始的混沌化
    vec3 p3 = fract(co * vec3(0.1031, 0.1030, 0.0973));

    // 2. 將向量與自己錯位的版本進行內積，大幅增加亂度
    p3 += dot(p3, p3.yxz + 33.33);

    // 3. 透過分量混合 (Swizzling) 產生 3 個互相獨立的隨機結果
    // (你原本加上的 + 0.05 保留下來)
    return fract((p3.xxy + p3.yxx) * p3.zyx) + 0.05;
}
// ===


void main(void) {
    gl_Position = uProjectionMatrix * uModelViewMatrix * vec4(aVertexPosition, 1.0);
    // vColor = aVertexColor;
    vTextureCoord = aTextureCoord;

    voxelColor = hash_(vec3(aVertexPosition.y) * 10.0);
}
