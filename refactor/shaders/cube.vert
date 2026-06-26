#version 300 es
precision mediump float;

in vec3 aVertexPosition;
in vec4 aVertexColor;
in vec2 aTextureCoord;

in float aAO; // Ambient occlusion level

uniform mat4 uModelViewMatrix;
uniform mat4 uProjectionMatrix;

uniform float uChunkHeight;
uniform float uTime; 

out highp vec2 vTextureCoord;

// flat so no interpolation
out vec3 voxelColor;
out float vAO;


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

vec3 hsv2rgb(vec3 c) {
    vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
    vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
    return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}


void main(void) {
    gl_Position = uProjectionMatrix * uModelViewMatrix * vec4(aVertexPosition, 1.0);
    vTextureCoord = aTextureCoord;

    // voxelColor = hash_(vec3(floor(aVertexPosition.y)) * 10.0);
    voxelColor = hsv2rgb(vec3(aVertexPosition.y/uChunkHeight, 0.5, 1.0));
    // voxelColor = hsv2rgb(vec3(aVertexPosition.y/uChunkHeight * (uTime*0.001), 0.5, 1.0));
    vAO = aAO;
}
