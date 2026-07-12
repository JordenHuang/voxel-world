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
// texture id: 8-bits
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

const float ATLAS_SIZE = 16.0;
const uint FACE_FRONT  = 0u;
const uint FACE_BACK   = 1u;
const uint FACE_TOP    = 2u;
const uint FACE_BOTTOM = 3u;
const uint FACE_RIGHT  = 4u;
const uint FACE_LEFT   = 5u;

vec3 hsv2rgb(vec3 c) {
    vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
    vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
    return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

uint getTextureId(uint blockId, uint faceId) {
    // Grass
    if (blockId == 0u) {
        return 0u;
    }
    // Stone
    else if (blockId == 1u) {
        return 1u;
    }
    // Dirt
    else if (blockId == 2u) {
        return 2u;
    }
    // Grass dirt
    else if (blockId == 3u) {
        if (faceId == FACE_TOP) return 0u;
        return 3u;
    }
    // Log
    else if (blockId == 4u) {
        return 4u;
    }
    // Snow
    else if (blockId == 14u) {
        return 14u;
    }
    // lava
    else if (blockId == 254u) {
        return 254u;
    }
    // Water
    else if (blockId == 67u) {
        return 67u;
    }
    // Leaves
    else if (blockId == 52u) {
        return 52u;
    }

    return 0u;
}

void main(void) {
    // Unpack data
    int localX = int((aChunkLocalPackedData >> 23u) & 0x1FFu);
    int localY = int((aChunkLocalPackedData >> 14u) & 0x1FFu);
    int localZ = int((aChunkLocalPackedData >> 5u) & 0x1FFu);
    vAO = float((aChunkLocalPackedData >> 3u) & 0x3u);
    uint faceId  = aChunkLocalPackedData & 0x07u;

    uint cornerId = (aTexturePackedData >> 30u) & 0x3u;
    uint blockId = (aTexturePackedData >> 22u) & 0xFFu;
    blockId -= 1u;

    uint textureId = getTextureId(blockId, faceId);

    // Calculate UV coordinate
    float localU = float((cornerId == 2u || cornerId == 3u) ? 1 : 0);
    float localV = float((cornerId == 1u || cornerId == 2u) ? 1 : 0);
    float col = mod(float(textureId), ATLAS_SIZE);
    float row = floor(float(textureId) / ATLAS_SIZE);

    vTextureCoord = vec2(
        (col + localU) / ATLAS_SIZE,
        (row + localV) / ATLAS_SIZE
    );

    // voxelColor = hsv2rgb(vec3(float(localY)/uChunkHeight, 0.5, 1.0));

    // Calculate gl_Position
    vec3 localPos = vec3(localX, localY, localZ);
    vec3 worldPos = localPos + uChunkWorldPos;

    gl_Position = uProjectionMatrix * uViewMatrix * vec4(worldPos, 1.0);
}
