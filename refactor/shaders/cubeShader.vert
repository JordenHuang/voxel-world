#version 330 core
out vec3 FragPos;

// Cube vertex positions generated procedurally based on gl_VertexID
vec3 getCubeVertex(int id) {
    const vec3 vertices[8] = vec3[8](
        vec3(-1.0, -1.0,  1.0),
        vec3( 1.0, -1.0,  1.0),
        vec3( 1.0,  1.0,  1.0),
        vec3(-1.0,  1.0,  1.0),
        vec3(-1.0, -1.0, -1.0),
        vec3( 1.0, -1.0, -1.0),
        vec3( 1.0,  1.0, -1.0),
        vec3(-1.0,  1.0, -1.0)
    );

    // Cube indices for 36 vertices (6 faces * 2 triangles * 3 vertices)
    const int indices[36] = int[36](
        0, 1, 2, 2, 3, 0, // front
        1, 5, 6, 6, 2, 1, // right
        5, 4, 7, 7, 6, 5, // back
        4, 0, 3, 3, 7, 4, // left
        3, 2, 6, 6, 7, 3, // top
        4, 5, 1, 1, 0, 4  // bottom
    );

    return vertices[indices[id]];
}

uniform mat4 model;
uniform mat4 view;
uniform mat4 projection;

void main() {
    vec3 pos = getCubeVertex(gl_VertexID);
    FragPos = vec3(model * vec4(pos, 1.0));
    gl_Position = projection * view * model * vec4(pos, 1.0);
}
