import type { Entity } from "./entities/index";
import type { ComponentMap, ComponentName } from "./components/";

export class ECS {
  private nextEntityId: Entity = 1;
  private registeredEntities = new Set<Entity>();
  private componentPools = new Map<ComponentName, Map<Entity, any>>();

  public createEntity(): Entity {
    const id = this.nextEntityId++;
    this.registeredEntities.add(id);
    return id;
  }

  public destroyEntity(entity: Entity) {
    this.registeredEntities.delete(entity);
    for (const pool of this.componentPools.values()) {
      pool.delete(entity);
    }
  }

  public attachComponent<K extends ComponentName>(entity: Entity, name: K, data: ComponentMap[K]) {
    if (!this.componentPools.has(name)) {
      this.componentPools.set(name, new Map());
    }
    this.componentPools.get(name)!.set(entity, data);
  }

  public removeComponent<K extends ComponentName>(entity: Entity, name: K): boolean {
    const pool = this.componentPools.get(name);

    // 如果這個組件的池子根本不存在，直接回傳 false
    if (!pool) {
      return false;
    }

    // 將該實體從這個組件的 Map 中刪除
    // .delete() 會在成功刪除時回傳 true，若該實體本來就沒這個組件則回傳 false
    return pool.delete(entity);
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
    // 如果沒有傳入任何條件，回傳空陣列
    if (componentNames.length === 0) return [];

    // 1. 抓出所有指定的 Component Pools (組件儲存池)
    const pools = componentNames.map(name => this.componentPools.get(name));

    // 如果其中有任何一個 Pool 是 undefined (代表世界上沒有任何實體擁有該組件)
    // 那交集一定為空，直接回傳
    if (pools.some(pool => !pool)) return [];

    // 從數量最少的集合開始比對，大幅減少迴圈次數
    // Sort pool size in descending order
    pools.sort((a, b) => b!.size - a!.size);

    const smallestPool = pools.pop()!;
    const otherPools = pools;
    const result: Entity[] = [];

    // 3. 遍歷最小的 Pool 裡面的所有 Entity ID
    for (const entity of smallestPool.keys()) {
      let hasAll = true;

      // 4. 檢查這個 Entity 是否也存在於「所有」其他的 Pool 中
      for (const pool of otherPools) {
        if (!pool!.has(entity)) {
          hasAll = false; // 只要有一個沒有，就不符合條件
          break;          // 提早結束這層檢查
        }
      }

      // 如果全部都有，就加入結果清單
      if (hasAll) {
        result.push(entity);
      }
    }

    return result;
  }

  public queryFirst(...componentNames: ComponentName[]): Entity | undefined {
    if (componentNames.length === 0) return undefined;

    const pools = componentNames.map(name => this.componentPools.get(name));
    if (pools.some(pool => !pool)) return undefined;

    pools.sort((a, b) => a!.size - b!.size);
    const smallestPool = pools[0]!;
    const otherPools = pools.slice(1);

    for (const entity of smallestPool.keys()) {
      const hasAll = otherPools.every(pool => pool!.has(entity));
      // Find the first one, immediatly return
      if (hasAll) {
        return entity; 
      }
    }

    return undefined;
  }

}
