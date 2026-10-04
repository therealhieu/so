/** Computed render output by `hash|width|variant`, least recently used evicted. */
export class RenderCache<T> {
  private readonly entries = new Map<string, T>();

  constructor(private readonly limit = 512) {}

  get(key: string, make: () => T): T {
    if (this.entries.has(key)) {
      const hit = this.entries.get(key) as T;
      this.entries.delete(key);
      this.entries.set(key, hit);
      return hit;
    }
    const value = make();
    this.entries.set(key, value);
    if (this.entries.size > this.limit) {
      const oldest = this.entries.keys().next().value;
      if (oldest !== undefined) this.entries.delete(oldest);
    }
    return value;
  }
}
