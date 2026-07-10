#version 300 es
precision mediump float;

in vec3 voxelColor;
in float vAO;
in highp vec2 vTextureCoord;

uniform sampler2D uSampler;
out vec4 fragColor;

const vec3 gamma = vec3(2.2);
const vec3 invGamma = 1.0 / gamma;

void main(void) {
    vec4 texture = texture(uSampler, vTextureCoord);
    vec3 texureRGB = texture.rgb;
    float aoMultiplier = 0.3 + (vAO / 3.0) * 0.6;

    texureRGB = pow(texureRGB, gamma);
        // texureRGB.rgb = voxelColor;

        // texureRGB = texureRGB * 0.001 + vec3(1, 1, 1);
        texureRGB = texureRGB * aoMultiplier;
        texture.a = 1.0;

    texureRGB = pow(texureRGB, invGamma);

    fragColor = vec4(texureRGB, texture.a);
}
