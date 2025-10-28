/**
 * Environment configuration utility for reading from env.json
 */

let envConfig: Record<string, string> | null = null;

/**
 * Load environment configuration from env.json
 * @returns Promise<Record<string, string>> - Environment variables
 */
export async function loadEnvConfig(): Promise<Record<string, string>> {
  if (envConfig) {
    return envConfig;
  }

  try {
    // Try to load from local env.json file first
    const envModule = await import('../env.json');
    envConfig = envModule.default || envModule;
    return envConfig as Record<string, string>;
  } catch (error) {
    console.error('Failed to load env.json, falling back to process.env:', error);
    // Fallback to process.env if env.json fails to load
    return process.env as Record<string, string>;
  }
}

/**
 * Get environment variable value
 * @param key - Environment variable key
 * @param defaultValue - Default value if key not found
 * @returns Promise<string> - Environment variable value
 */
export async function getEnvVar(key: string, defaultValue: string = ''): Promise<string> {
  const config = await loadEnvConfig();
  return config[key] || defaultValue;
}

/**
 * Get environment variable value synchronously (requires pre-loaded config)
 * @param key - Environment variable key
 * @param defaultValue - Default value if key not found
 * @returns string - Environment variable value
 */
export function getEnvVarSync(key: string, defaultValue: string = ''): string {
  if (envConfig) {
    return envConfig[key] || defaultValue;
  }
  
  // Fallback to process.env if config not loaded
  return process.env[key] || defaultValue;
}

/**
 * Initialize environment configuration
 * This should be called early in the application lifecycle
 */
export async function initializeEnvConfig(): Promise<void> {
  try {
    await loadEnvConfig();
    console.log('Environment configuration loaded from env.json');
  } catch (error) {
    console.warn('Failed to load env.json, using process.env fallback:', error);
  }
}

/**
 * Check if required environment variables are present
 * @param requiredVars - Array of required environment variable keys
 * @returns Promise<boolean> - True if all required variables are present
 */
export async function validateRequiredEnvVars(requiredVars: string[]): Promise<boolean> {
  const config = await loadEnvConfig();
  const missingVars = requiredVars.filter(varName => !config[varName]);
  
  if (missingVars.length > 0) {
    console.error('Missing required environment variables:', missingVars);
    return false;
  }
  
  return true;
}
