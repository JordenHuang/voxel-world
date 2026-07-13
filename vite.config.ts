import { defineConfig } from 'vite'

export default defineConfig({
  server: {
    watch: {
      usePolling: true,
    },
  },
  base: "/voxel-world/",
})
