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
// layout(location = 1) in uint aTexturePackedData;

layout(std140) uniform TransformBlock {
    mat4 uViewMatrix;
    mat4 uProjectionMatrix;
};

uniform vec3 uChunkWorldPos;

void main(void) {
    // Unpack data
    int localX = int((aChunkLocalPackedData >> 23u) & 0x1FFu);
    int localY = int((aChunkLocalPackedData >> 14u) & 0x1FFu);
    int localZ = int((aChunkLocalPackedData >> 5u) & 0x1FFu);

    // Calculate gl_Position
    vec3 localPos = (vec3(localX, localY, localZ)-0.5) * 1.005 + 0.5;
    vec3 worldPos = localPos + uChunkWorldPos;

    gl_Position = uProjectionMatrix * uViewMatrix * vec4(worldPos, 1.0);
}
