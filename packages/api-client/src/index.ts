// Re-export generated client
export * from './generated/index.js';

// Client configuration helper
export interface ClientConfig {
  baseUrl: string;
  getAuthToken?: () => Promise<string | null>;
}

/**
 * Create a configured API client instance.
 */
export function createApiClient(config: ClientConfig) {
  // This will be populated after code generation
  // For now, return a placeholder that will be replaced
  return {
    config,
    // Methods will be added by generated code
  };
}

