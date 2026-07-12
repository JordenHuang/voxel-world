#version 300 es
precision mediump float;

out vec4 fragColor;

void main() {
    vec2 center = gl_PointCoord - vec2(0.5);
    float distSq = dot(center, center);

    if (distSq > 0.25) {
        discard;
    }

    fragColor = vec4(0.6, 0.6, 0.6, 0.5);
}
