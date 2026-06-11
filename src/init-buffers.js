function initBuffers(gl) {
  const positionBuffer = initPositionBuffer(gl);
  const colorBuffer = initColorBuffer(gl);
  const indexBuffer = initIndexBuffer(gl);
  const textureCoordBuffer = initTextureCoordBuffer(gl);
  const wireframeBuffer = initWireframeIndexBuffer(gl);

  return {
    position: positionBuffer,
    color: colorBuffer,
    indices: indexBuffer,
    texture: textureCoordBuffer,
    wireframeIndices: wireframeBuffer,
  };
}

function initPositionBuffer(gl) {
  // Create a buffer for the square's positions.
  const positionBuffer = gl.createBuffer();

  // Select the positionBuffer as the one to apply buffer
  // operations to from here out.
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

  const positions = [
    // Front face
    1.0, -1.0, 1.0, 1.0, 1.0, 1.0, -1.0, 1.0, 1.0, -1.0, -1.0, 1.0,

    // Back face
    -1.0, -1.0, -1.0, -1.0, 1.0, -1.0, 1.0, 1.0, -1.0, 1.0, -1.0, -1.0,

    // Top face
    1.0, 1.0, 1.0, 1.0, 1.0, -1.0, -1.0, 1.0, -1.0, -1.0, 1.0, 1.0,

    // Bottom face
    1.0, -1.0, -1.0, 1.0, -1.0, 1.0, -1.0, -1.0, 1.0, -1.0, -1.0, -1.0,

    // Right face
    1.0, -1.0, -1.0, 1.0, 1.0, -1.0, 1.0, 1.0, 1.0, 1.0, -1.0, 1.0,

    // Left face
    -1.0, -1.0, 1.0, -1.0, 1.0, 1.0, -1.0, 1.0, -1.0, -1.0, -1.0, -1.0,
  ];

  // Now pass the list of positions into WebGL to build the
  // shape. We do this by creating a Float32Array from the
  // JavaScript array, then use it to fill the current buffer.
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

  return positionBuffer;
}

function initColorBuffer(gl) {
  const faceColors = [
    [1.0, 1.0, 1.0, 1.0], // Front face: white
    [1.0, 0.0, 0.0, 1.0], // Back face: red
    [0.0, 1.0, 0.0, 1.0], // Top face: green
    [0.0, 0.0, 1.0, 1.0], // Bottom face: blue
    [1.0, 1.0, 0.0, 1.0], // Right face: yellow
    [1.0, 0.0, 1.0, 1.0], // Left face: purple
  ];

  // Convert the array of colors into a table for all the vertices.

  let colors = [];

  for (const c of faceColors) {
    // Repeat each color four times for the four vertices of the face
    colors = colors.concat(c, c, c, c);
  }

  const colorBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);

  return colorBuffer;
}

function initIndexBuffer(gl) {
  const indexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);

  // This array defines each face as two triangles, using the
  // indices into the vertex array to specify each triangle's
  // position.

  // prettier-ignore
  const indices = [
     0,  1,  2,      0,  2,  3,    // front
     4,  5,  6,      4,  6,  7,    // back
     8,  9,  10,     8,  10, 11,   // top
     12, 13, 14,     12, 14, 15,   // bottom
     16, 17, 18,     16, 18, 19,   // right
     20, 21, 22,     20, 22, 23,   // left
  ];

  // Now send the element array to GL

  gl.bufferData(
    gl.ELEMENT_ARRAY_BUFFER,
    new Uint16Array(indices),
    gl.STATIC_DRAW,
  );

  return indexBuffer;
}

function initTextureCoordBuffer(gl) {
  const textureCoordinates = [
    // Front
    1.0, 0.0, 1.0, 1.0, 0.0, 1.0, 0.0, 0.0,
    // Back
    1.0, 0.0, 1.0, 1.0, 0.0, 1.0, 0.0, 0.0,
    // Top
    1.0, 0.0, 1.0, 1.0, 0.0, 1.0, 0.0, 0.0,
    // Bottom
    1.0, 0.0, 1.0, 1.0, 0.0, 1.0, 0.0, 0.0,
    // Right
    1.0, 0.0, 1.0, 1.0, 0.0, 1.0, 0.0, 0.0,
    // Left
    1.0, 0.0, 1.0, 1.0, 0.0, 1.0, 0.0, 0.0,
  ];

  const textureCoordBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, textureCoordBuffer);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array(textureCoordinates),
    gl.STATIC_DRAW
  );
  return textureCoordBuffer;
}

function initWireframeIndexBuffer(gl) {
  const wireframeBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, wireframeBuffer);

  // 每一行代表一條線 (兩個頂點連在一起)
  // 這裡的數字對應到你 positionBuffer 裡的頂點順序
  const wireframeIndices = [
    // Front face (前面)
    0, 1,   1, 2,   2, 3,   3, 0,   0, 2,  // 0, 2 是對角線
    // Back face (後面)
    4, 5,   5, 6,   6, 7,   7, 4,   4, 6,
    // Top face (頂面)
    8, 9,   9, 10,  10, 11,  11, 8,   8, 10,
    // Bottom face (底面)
    12, 13,  13, 14,  14, 15,  15, 12,  12, 14,
    // Right face (右面)
    16, 17,  17, 18,  18, 19,  19, 16,  16, 18,
    // Left face (左面)
    20, 21,  21, 22,  22, 23,  23, 20,  20, 22
  ];

  gl.bufferData(
    gl.ELEMENT_ARRAY_BUFFER,
    new Uint16Array(wireframeIndices),
    gl.STATIC_DRAW
  );

  return wireframeBuffer;
}

export { initBuffers };
