#version 300 es
precision mediump float;

// LSB
// x: 9-bits
// y: 9-bits
// z: 9-bits
// ambient occllusion level: 2-bits
// face id: 3-bits
// MSB
layout(location = 0) in uint aChunkLocalPackedData;

// LSB
// corner id: 2-bits (uv)
// texture id: 7-bits
// MSB
layout(location = 1) in uint aTexturePackedData;

layout(std140) uniform TransformBlock {
    mat4 uViewMatrix;
    mat4 uProjectionMatrix;
};

uniform vec3 uChunkWorldPos;

in vec2 aTextureCoord;

uniform float uChunkHeight;
uniform float uTime; 

out highp vec2 vTextureCoord;

out vec3 voxelColor;
out float vAO;

vec3 hsv2rgb(vec3 c) {
    vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
    vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
    return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

void main(void) {
    // Unpack data
    int localX = int((aChunkLocalPackedData >> 23u) & 0x1FFu);
    int localY = int((aChunkLocalPackedData >> 14u) & 0x1FFu);
    int localZ = int((aChunkLocalPackedData >> 5u) & 0x1FFu);
    vAO = float((aChunkLocalPackedData >> 3u) & 0x3u);

    uint cornerId = (aTexturePackedData >> 30u) & 0x3u;
    uint textureId = (aTexturePackedData >> 0u) & 0xFFu;

    // Calculate UV coordinate
    float localU = float((cornerId == 2u || cornerId == 3u) ? 1 : 0);
    float localV = float((cornerId == 1u || cornerId == 2u) ? 1 : 0);
    float col = float(textureId % 1u);
    float row = float(textureId / 1u);

    vTextureCoord = vec2(
        (col + localU) / aTextureCoord.x,
        (row + localV) / aTextureCoord.y
    );

    voxelColor = hsv2rgb(vec3(float(localY)/uChunkHeight, 0.5, 1.0));

    // Calculate gl_Position
    vec3 localPos = vec3(localX, localY, localZ);
    vec3 worldPos = localPos + uChunkWorldPos;

    gl_Position = uProjectionMatrix * uViewMatrix * vec4(worldPos, 1.0);
}
