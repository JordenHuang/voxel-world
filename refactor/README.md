
## TODO
- https://github.com/SanderMertens/ecs-faq
- [] Data packing
- [] System schedule system
- [] Re-implement raycasting and block placement/destruction
- [] task queue (or Web worker)
- [] Shadow base on sunlight
- [] Highlight cursor pointed block
- [] PlayerManager

## Design
What should `PlayerControlSystem` control? Main player? All player? Or even animals/monsters?
Idea 1: Entities with `InputState` component


### 2026-07-06
- [x] Re-implement frustum culling

### 2026-07-04
- [x] Refactor systems
- [x] Refactor utils

### 2026-07-03
Clean up and refactor
- Introduce velocity component
- Introduce more tags for entities, worlds, states
- Fix camera aspect ratio not initialize problem in startup
- Player control system now updates velocity, and movement system update
final positions

### 2026-07-02
- Implement infinite world generation and shadowing

### 2026-06-27
Refactor to ECS architecture
- Implement raycasting, block placement/destruction

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

