/**
 * Environment variable validation and type-safe access
 */

interface EnvironmentVariables {
  NEXT_PUBLIC_API_URL: string;
  NODE_ENV: 'development' | 'production' | 'test';
}

class EnvironmentError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'EnvironmentError';
  }
}

/**
 * Validates that all required environment variables are present
 * @throws {EnvironmentError} If required variables are missing
 */
function validateEnvironment(): void {
  const missing: string[] = [];

  // Check for required public variables
  if (!process.env.NEXT_PUBLIC_API_URL && process.env.NODE_ENV === 'production') {
    missing.push('NEXT_PUBLIC_API_URL');
  }

  if (missing.length > 0) {
    throw new EnvironmentError(
      `Missing required environment variables: ${missing.join(', ')}\n` +
      'Please check your .env file or environment configuration.'
    );
  }
}

/**
 * Get environment variable with type safety and validation
 */
export function getEnv<K extends keyof EnvironmentVariables>(
  key: K,
  fallback?: EnvironmentVariables[K]
): EnvironmentVariables[K] {
  const value = process.env[key] as EnvironmentVariables[K] | undefined;

  if (value === undefined) {
    if (fallback !== undefined) {
      return fallback;
    }
    throw new EnvironmentError(`Environment variable ${key} is not defined`);
  }

  return value;
}

/**
 * Get API base URL from environment variable.
 * Always reads from NEXT_PUBLIC_API_URL — falls back to localhost only in development.
 */
export function getApiUrl(): string {
  const envUrl = process.env.NEXT_PUBLIC_API_URL;

  if (envUrl) {
    // Strip trailing slash for consistency
    return envUrl.replace(/\/+$/, '');
  }

  // Only fall back in development; in production the env var must be set.
  if (process.env.NODE_ENV === 'development') {
    return 'http://localhost:8000';
  }

  // Hard-crash in production so mis-configuration is caught immediately
  throw new EnvironmentError(
    'NEXT_PUBLIC_API_URL is not set. Please configure it in your environment variables.'
  );
}

/**
 * Check if running in development mode
 */
export function isDevelopment(): boolean {
  return process.env.NODE_ENV === 'development';
}

/**
 * Check if running in production mode
 */
export function isProduction(): boolean {
  return process.env.NODE_ENV === 'production';
}

/**
 * Check if running on server
 */
export function isServer(): boolean {
  return typeof window === 'undefined';
}

// Validate environment on module load (only in production)
if (isProduction() && !isServer()) {
  try {
    validateEnvironment();
  } catch (error) {
    if (error instanceof EnvironmentError) {
      console.error('[Environment]', error.message);
    }
  }
}

export { EnvironmentError };
