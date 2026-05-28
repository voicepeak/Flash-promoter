import type { PlatformId } from "../models.js";
import type { PlatformAdapter } from "./types.js";

export class AdapterRegistry {
  private readonly adapters = new Map<PlatformId, PlatformAdapter>();

  register(adapter: PlatformAdapter): void {
    this.adapters.set(adapter.id, adapter);
  }

  get(id: PlatformId): PlatformAdapter {
    const adapter = this.adapters.get(id);
    if (!adapter) {
      throw new Error(`Platform adapter not registered: ${id}`);
    }
    return adapter;
  }

  list(): PlatformAdapter[] {
    return Array.from(this.adapters.values());
  }
}
