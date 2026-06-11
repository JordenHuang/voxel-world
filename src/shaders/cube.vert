attribute vec4 aVertexPosition;
attribute vec4 aVertexColor;
attribute vec2 aTextureCoord;

uniform mat4 uModelViewMatrix;
uniform mat4 uProjectionMatrix;

varying highp vec2 vTextureCoord;

varying lowp vec4 vColor;

void main(void) {
    gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
    // vColor = aVertexColor;
    vTextureCoord = aTextureCoord;
}
