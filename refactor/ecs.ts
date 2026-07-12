import type { Entity } from "./entities/index";
import type { ComponentMap, ComponentName } from "./components/";

export class ECS {
  private nextEntityId: Entity = 1;
  private registeredEntities = new Set<Entity>();
  private componentPools = new Map<ComponentName, Map<Entity, any>>();
  private queryCache = new Map<string, Entity[]>();
  private queryFirstCache = new Map<string, Entity | undefined>();

  private invalidateCache() {
    this.queryCache.clear();
    this.queryFirstCache.clear();
  }

  public createEntity(): Entity {
    const id = this.nextEntityId++;
    this.registeredEntities.add(id);
    return id;
  }

  public destroyEntity(entity: Entity) {
    this.registeredEntities.delete(entity);
    let changed = false;
    for (const pool of this.componentPools.values()) {
      if (pool.delete(entity)) {
        changed = true;
      }
    }
    if (changed) {
      this.invalidateCache();
    }
  }

  public attachComponent<K extends ComponentName>(entity: Entity, name: K, data: ComponentMap[K]) {
    if (!this.componentPools.has(name)) {
      this.componentPools.set(name, new Map());
    }
    const pool = this.componentPools.get(name)!;
    if (!pool.has(entity)) {
      pool.set(entity, data);
      this.invalidateCache();
    } else {
      pool.set(entity, data);
    }
  }

  public removeComponent<K extends ComponentName>(entity: Entity, name: K): boolean {
    const pool = this.componentPools.get(name);

    if (!pool) {
      return false;
    }

    const deleted = pool.delete(entity);
    if (deleted) {
      this.invalidateCache();
    }
    return deleted;
  }

  public hasComponent<K extends ComponentName>(entity: Entity, name: K): boolean {
    const componentPool = this.componentPools.get(name);
    if (componentPool === undefined)
      return false;
    return componentPool.has(entity);
  }

  public getComponent<K extends ComponentName>(entity: Entity, name: K): ComponentMap[K] | undefined {
    return this.componentPools.get(name)?.get(entity);
  }

  public query(...componentNames: ComponentName[]): Entity[] {
    if (componentNames.length === 0) return [];

    const cacheKey = [...componentNames].sort().join(",");
    if (this.queryCache.has(cacheKey)) {
      return this.queryCache.get(cacheKey)!;
    }

    const pools = componentNames.map(name => this.componentPools.get(name));

    if (pools.some(pool => !pool)) {
      this.queryCache.set(cacheKey, []);
      return [];
    }

    pools.sort((a, b) => b!.size - a!.size);

    const smallestPool = pools.pop()!;
    const otherPools = pools;
    const result: Entity[] = [];

    for (const entity of smallestPool.keys()) {
      let hasAll = true;

      for (const pool of otherPools) {
        if (!pool!.has(entity)) {
          hasAll = false;
          break;
        }
      }

      if (hasAll) {
        result.push(entity);
      }
    }

    this.queryCache.set(cacheKey, result);
    return result;
  }

  public queryFirst(...componentNames: ComponentName[]): Entity | undefined {
    if (componentNames.length === 0) return undefined;

    const cacheKey = [...componentNames].sort().join(",");
    if (this.queryFirstCache.has(cacheKey)) {
      return this.queryFirstCache.get(cacheKey);
    }

    const pools = componentNames.map(name => this.componentPools.get(name));
    if (pools.some(pool => !pool)) {
      this.queryFirstCache.set(cacheKey, undefined);
      return undefined;
    }

    pools.sort((a, b) => a!.size - b!.size);
    const smallestPool = pools[0]!;
    const otherPools = pools.slice(1);

    for (const entity of smallestPool.keys()) {
      const hasAll = otherPools.every(pool => pool!.has(entity));
      if (hasAll) {
        this.queryFirstCache.set(cacheKey, entity);
        return entity; 
      }
    }

    this.queryFirstCache.set(cacheKey, undefined);
    return undefined;
  }

}
