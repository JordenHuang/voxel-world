export enum BlockId {
  AIR = 0,
  GRASS,
  STONE,
  DIRT,
  GRASS_DIRT,
}

export function isAirBlock(id: number): boolean {
  return id === BlockId.AIR;
}

