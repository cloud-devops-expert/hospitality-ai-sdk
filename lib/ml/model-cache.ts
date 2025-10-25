/**
 * ML Model Cache (Singleton)
 *
 * Caches Transformers.js pipelines to avoid re-loading models on every request
 * CRITICAL for performance - reduces inference time from 30s to <1s
 */

import type { Pipeline } from '@xenova/transformers';

// Model cache - stores loaded pipelines
const modelCache = new Map<string, Promise<Pipeline>>();

/**
 * Get or create a cached pipeline
 *
 * Usage:
 *   const translator = await getCachedPipeline('translation', 'Xenova/nllb-200-distilled-600M');
 *   const result = await translator(text, {...options});
 *
 * @param task - Pipeline task (e.g., 'translation', 'question-answering')
 * @param model - Model identifier (e.g., 'Xenova/nllb-200-distilled-600M')
 * @param options - Optional pipeline options
 * @returns Cached or newly created pipeline
 */
export async function getCachedPipeline(
  task: string,
  model: string,
  options?: Record<string, any>
): Promise<Pipeline> {
  const cacheKey = `${task}::${model}`;

  // Check if model is already cached
  if (modelCache.has(cacheKey)) {
    console.log(`[Model Cache] Using cached model: ${cacheKey}`);
    return modelCache.get(cacheKey)!;
  }

  console.log(`[Model Cache] Loading new model: ${cacheKey}`);
  const startTime = performance.now();

  // Create promise for loading model (avoids concurrent loads)
  const pipelinePromise = (async () => {
    const { pipeline } = await import('@xenova/transformers');
    const pipe = await pipeline(task, model, options);
    const loadTime = Math.round(performance.now() - startTime);
    console.log(`[Model Cache] Model loaded in ${loadTime}ms: ${cacheKey}`);
    return pipe;
  })();

  // Cache the promise immediately (prevents duplicate loads)
  modelCache.set(cacheKey, pipelinePromise);

  return pipelinePromise;
}

/**
 * Preload a model into cache (optional optimization)
 *
 * Usage:
 *   await preloadModel('translation', 'Xenova/nllb-200-distilled-600M');
 *
 * @param task - Pipeline task
 * @param model - Model identifier
 * @param options - Optional pipeline options
 */
export async function preloadModel(
  task: string,
  model: string,
  options?: Record<string, any>
): Promise<void> {
  await getCachedPipeline(task, model, options);
}

/**
 * Clear a specific model from cache (for memory management)
 *
 * @param task - Pipeline task
 * @param model - Model identifier
 */
export function clearModelCache(task: string, model: string): void {
  const cacheKey = `${task}::${model}`;
  if (modelCache.has(cacheKey)) {
    console.log(`[Model Cache] Clearing cached model: ${cacheKey}`);
    modelCache.delete(cacheKey);
  }
}

/**
 * Clear all cached models
 */
export function clearAllModelCaches(): void {
  console.log(`[Model Cache] Clearing all cached models (${modelCache.size} models)`);
  modelCache.clear();
}

/**
 * Get cache statistics
 */
export function getCacheStats(): {
  cachedModels: number;
  models: string[];
} {
  return {
    cachedModels: modelCache.size,
    models: Array.from(modelCache.keys()),
  };
}

// Commonly used models (for reference)
export const MODELS = {
  TRANSLATION: {
    task: 'translation' as const,
    model: 'Xenova/nllb-200-distilled-600M',
  },
  QUESTION_ANSWERING: {
    task: 'question-answering' as const,
    model: 'Xenova/distilbert-base-cased-distilled-squad',
  },
  TEXT_SUMMARIZATION: {
    task: 'summarization' as const,
    model: 'Xenova/distilbart-cnn-6-6',
  },
  EMBEDDINGS: {
    task: 'feature-extraction' as const,
    model: 'Xenova/all-MiniLM-L6-v2',
  },
  IMAGE_CLASSIFICATION: {
    task: 'image-classification' as const,
    model: 'Xenova/vit-base-patch16-224',
  },
  OBJECT_DETECTION: {
    task: 'object-detection' as const,
    model: 'Xenova/detr-resnet-50',
  },
} as const;

/**
 * Preload commonly used models at startup (optional)
 *
 * Call this in your server initialization to warm up the cache
 *
 * Usage:
 *   await preloadCommonModels(['translation', 'question-answering']);
 */
export async function preloadCommonModels(models: Array<keyof typeof MODELS>): Promise<void> {
  console.log(`[Model Cache] Preloading ${models.length} models...`);
  const startTime = performance.now();

  await Promise.all(
    models.map((modelKey) => {
      const { task, model } = MODELS[modelKey];
      return preloadModel(task, model);
    })
  );

  const totalTime = Math.round(performance.now() - startTime);
  console.log(`[Model Cache] All models preloaded in ${totalTime}ms`);
}
