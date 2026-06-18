#version 300 es
precision mediump float;

// in lowp vec4 vColor;

in highp vec2 vTextureCoord;
uniform sampler2D uSampler;

out vec4 fragColor;

const vec3 gamma = vec3(2.2);
const vec3 invGamma = 1.0 / gamma;

in vec3 voxelColor;
// const vec3 voxelColor = vec3(255.0, 255.0, 0.0);

void main(void) {
    vec3 texCol = texture(uSampler, vTextureCoord).rgb;

    texCol = pow(texCol, gamma);
    // texCol.rgb = voxelColor / 255.0;
    texCol.rgb = voxelColor;
    texCol = pow(texCol, invGamma);

    fragColor = vec4(texCol, 1.0);

    // fragColor = texture(uSampler, vTextureCoord);
    // gl_FragColor = vColor;
}
