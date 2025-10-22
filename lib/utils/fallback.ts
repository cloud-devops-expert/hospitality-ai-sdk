/**
 * Fallback Pattern for ML Libraries
 * Tries library method first, falls back to custom implementation
 */

export interface FallbackOptions {
  timeout?: number; // Timeout in ms
  preferLibrary?: boolean; // Whether to prefer library over custom
  retries?: number; // Number of retries before fallback
  onFallback?: (error: Error) => void; // Callback when fallback triggered
}

export interface MethodResult<T> {
  data: T;
  method: 'library' | 'custom';
  processingTime: number;
  error?: Error;
}

/**
 * Execute a method with fallback support
 *
 * @param libraryMethod - Async method using an external library
 * @param customMethod - Sync/async custom implementation
 * @param options - Configuration options
 * @returns Result with metadata about which method was used
 *
 * @example
 * ```typescript
 * const result = await executeWithFallback(
 *   async () => analyzeSentimentNatural(text),
 *   () => analyzeSentimentCustom(text),
 *   { timeout: 100, preferLibrary: true }
 * );
 *
 * console.log(result.method); // 'library' or 'custom'
 * console.log(result.data); // Analysis result
 * ```
 */
export async function executeWithFallback<T>(
  libraryMethod: () => Promise<T>,
  customMethod: () => T | Promise<T>,
  options: FallbackOptions = {}
): Promise<MethodResult<T>> {
  const {
    timeout = 5000,
    preferLibrary = true,
    retries = 0,
    onFallback
  } = options;

  // If custom is preferred, skip library entirely
  if (!preferLibrary) {
    const startTime = Date.now();
    const data = await Promise.resolve(customMethod());
    return {
      data,
      method: 'custom',
      processingTime: Date.now() - startTime
    };
  }

  // Try library method with timeout and retries
  let attempt = 0;
  let lastError: Error | undefined;

  while (attempt <= retries) {
    try {
      const startTime = Date.now();

      // Race between library execution and timeout
      const data = await Promise.race([
        libraryMethod(),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Timeout exceeded')), timeout)
        )
      ]);

      return {
        data,
        method: 'library',
        processingTime: Date.now() - startTime
      };
    } catch (error) {
      lastError = error as Error;
      attempt++;

      if (attempt <= retries) {
        // Wait before retry (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, 100 * Math.pow(2, attempt)));
      }
    }
  }

  // All library attempts failed, use custom fallback
  if (onFallback && lastError) {
    onFallback(lastError);
  }

  const startTime = Date.now();
  const data = await Promise.resolve(customMethod());

  return {
    data,
    method: 'custom',
    processingTime: Date.now() - startTime,
    error: lastError
  };
}

/**
 * Lazy load a library and cache it
 * Useful for code-splitting large libraries
 */
export class LibraryLoader<T> {
  private cache: T | null = null;
  private loading: Promise<T> | null = null;

  constructor(private loader: () => Promise<T>) {}

  async load(): Promise<T> {
    if (this.cache) {
      return this.cache;
    }

    if (this.loading) {
      return this.loading;
    }

    this.loading = this.loader();
    this.cache = await this.loading;
    this.loading = null;

    return this.cache;
  }

  isLoaded(): boolean {
    return this.cache !== null;
  }

  clear(): void {
    this.cache = null;
    this.loading = null;
  }
}

/**
 * Feature flags for enabling/disabling libraries
 */
export const LIBRARY_FLAGS = {
  sentiment: {
    useNatural: process.env.NEXT_PUBLIC_USE_NATURAL === 'true',
    timeout: 100,
  },
  forecast: {
    useBrainJS: process.env.NEXT_PUBLIC_USE_BRAINJS === 'true',
    timeout: 200, // LSTM takes longer to train
  },
  pricing: {
    useRegression: process.env.NEXT_PUBLIC_USE_REGRESSION === 'true',
    timeout: 50,
  },
  noShow: {
    useMLjs: process.env.NEXT_PUBLIC_USE_MLJS === 'true',
    timeout: 200,
  },
} as const;

/**
 * Telemetry for tracking fallback usage
 */
export class FallbackTelemetry {
  private static stats = {
    library: 0,
    custom: 0,
    errors: 0,
    timeouts: 0,
  };

  static recordMethod(method: 'library' | 'custom'): void {
    this.stats[method]++;
  }

  static recordError(type: 'error' | 'timeout'): void {
    if (type === 'timeout') {
      this.stats.timeouts++;
    } else {
      this.stats.errors++;
    }
  }

  static getStats() {
    const total = this.stats.library + this.stats.custom;
    return {
      ...this.stats,
      total,
      libraryPercentage: total > 0 ? (this.stats.library / total) * 100 : 0,
      customPercentage: total > 0 ? (this.stats.custom / total) * 100 : 0,
    };
  }

  static reset(): void {
    this.stats = {
      library: 0,
      custom: 0,
      errors: 0,
      timeouts: 0,
    };
  }
}
