#version 300 es
precision mediump float;

uniform float uTime;

out vec4 fragColor;

const vec3 gamma = vec3(2.2);
const vec3 invGamma = 1.0 / gamma;
const vec3 selectedColor = vec3(1.0);

void main(void) {
    float speed = 4.0;
    float basePulse = (sin(uTime * speed) * 0.5) + 0.5;
    float sharpness = 3.0;
    float pulse = pow(basePulse, sharpness);

    float alpha = mix(0.001, 0.8, pulse);

    fragColor = vec4(selectedColor, alpha);
}
