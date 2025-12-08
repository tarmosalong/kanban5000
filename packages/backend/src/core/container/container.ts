/**
 * Simple dependency injection container.
 * Supports singleton registration and resolution by key.
 */
export class Container {
  private services = new Map<string, unknown>();
  private factories = new Map<string, () => unknown>();

  /**
   * Register a singleton instance.
   */
  register<T>(key: string, instance: T): void {
    if (this.services.has(key) || this.factories.has(key)) {
      throw new Error(`Service '${key}' is already registered`);
    }
    this.services.set(key, instance);
  }

  /**
   * Register a factory function for lazy instantiation.
   */
  registerFactory<T>(key: string, factory: () => T): void {
    if (this.services.has(key) || this.factories.has(key)) {
      throw new Error(`Service '${key}' is already registered`);
    }
    this.factories.set(key, factory);
  }

  /**
   * Resolve a service by key.
   * @throws Error if service is not registered
   */
  resolve<T>(key: string): T {
    // Check if already instantiated
    if (this.services.has(key)) {
      return this.services.get(key) as T;
    }

    // Check for factory
    const factory = this.factories.get(key);
    if (factory) {
      const instance = factory() as T;
      this.services.set(key, instance);
      this.factories.delete(key);
      return instance;
    }

    throw new Error(`Service '${key}' is not registered`);
  }

  /**
   * Check if a service is registered.
   */
  has(key: string): boolean {
    return this.services.has(key) || this.factories.has(key);
  }

  /**
   * Clear all registrations (useful for testing).
   */
  clear(): void {
    this.services.clear();
    this.factories.clear();
  }
}

/**
 * Global application container instance.
 */
export const container = new Container();

