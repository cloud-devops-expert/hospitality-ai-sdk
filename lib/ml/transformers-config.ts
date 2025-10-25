/**
 * Transformers.js Configuration
 *
 * Configure Transformers.js to work in browser without native dependencies
 */

import { env } from '@xenova/transformers';

// Configure Transformers.js environment for browser
export function configureTransformers() {
  // Disable local model loading (use CDN only)
  env.allowLocalModels = false;

  // Use remote models from Hugging Face CDN
  env.allowRemoteModels = true;

  // Disable GPU acceleration for now (use CPU/WASM)
  env.backends.onnx.wasm.numThreads = 1;

  console.log('[Transformers.js] Configured for browser environment');
}

// Auto-configure on import
if (typeof window !== 'undefined') {
  configureTransformers();
}
