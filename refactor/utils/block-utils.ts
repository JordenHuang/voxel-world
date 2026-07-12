export enum BlockId {
  AIR = 0,
  GRASS,
  STONE,
  DIRT,
  GRASS_DIRT,
  LOG,

  SNOW = 15,
  WATER = 68,
  LEAVES = 53,
  LAVA = 255,

}

export function isAirBlock(id: number): boolean {
  return id === BlockId.AIR;
}

