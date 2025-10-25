/**
 * Mock sharp module for browser environment
 *
 * Sharp is a Node.js native module for image processing.
 * We don't need it for text-only NLP models, so we provide this mock
 * to prevent bundling errors in the browser.
 */

// Export a no-op function that throws an error if accidentally called
export default function sharp() {
  throw new Error(
    'Sharp is not available in browser. Use image models on server-side only.'
  );
}

// Mock any commonly used sharp methods
sharp.prototype = {
  resize: () => sharp(),
  toBuffer: () => Promise.reject(new Error('Sharp not available in browser')),
  toFile: () => Promise.reject(new Error('Sharp not available in browser')),
};
