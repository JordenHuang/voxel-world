
## Fix
- [] Neighbor chunks should also check if it needs redraw when removing block in a chunk
- [] Ambient occlusion at chunk border is weird

## TODO
- https://github.com/SanderMertens/ecs-faq
- [] task queue (or Web worker)
- [] Shadow base on sunlight
- [] Data packing
- [] Highlight cursor pointed block
- [] PlayerManager class

### 2026-06-23
- [x] Raycasting and block placement/destruction

### 2026-06-22
- [x] frustum culling
  - https://learnopengl.com/Guest-Articles/2021/Scene/Frustum-Culling
  - https://bruop.github.io/frustum_culling
  - AABB:
    - https://ktstephano.github.io/rendering/stratusgfx/aabbs
- [x] Shadow between blocks
  - Ambient occlusion
    - https://0fps.net/2013/07/03/ambient-occlusion-for-minecraft-like-worlds/
### 2026-06-19
- [x] color/texture toggle
  - Change texture to white image and apply color using shader
- [x] Use vertex array object to reduce webgl API call
### 2026-06-18
- [x] world generation (Perlin noise)
### 2026-06-17
- [x] load/off load chunks
### 2026-06-16
- [x] More cubes (Mesh class, Chunk class, World class, (Model class ?))
  - Model class: Handlek WebGL buffers
  - Chunk class: Manage blocks
  - World class: Manage chunks
  - ChunkMeshBuilder class: Build chunk mesh dynamically
- [x] Face culling
### 2026-06-12
- Mesh interface
- Model class
- [x] Integer coordinate is at the edge of block, not center
### 2026-06-11
- [x] Renderer class
- [x] Shader class
- [x] Custom texture
- [x] Game class


## References:
- Cube obj: https://github.com/garykac/3d-cubes/blob/master/cube.obj
- https://github.com/tsoding/koil/blob/4073a5ba42273dc09bff35d82b68e46689d6597b/index.mts
- Matrix layout: https://webglfundamentals.org/webgl/lessons/webgl-matrix-vs-math.html
- Hot reload in WSL2: https://stackoverflow.com/questions/74625283/vue3-vite-hot-reload-hmr-no-working-in-the-browser
- Texture `news.jpg`: https://pixabay.com/illustrations/cardinal-directions-directions-6372089/
- Texture `placeholder.png`: https://openclipart.org/detail/244429/texture-mapping-test-image
- Minecraft source code: https://github.com/WangTingZheng/mcp940/blob/master/src/minecraft/net/minecraft/init/Blocks.java

