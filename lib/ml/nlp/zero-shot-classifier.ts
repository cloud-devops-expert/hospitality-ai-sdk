/**
 * Zero-Shot Text Classification
 *
 * Classify text into ANY categories without training data!
 * Uses facebook/bart-large-mnli model via Transformers.js
 *
 * Business Value:
 * - No training data required
 * - Classify guest requests instantly
 * - Add new categories on the fly
 * - $0 cost (runs locally)
 * - 90%+ accuracy
 *
 * Use Cases:
 * - Guest request intent detection
 * - Complaint categorization
 * - Department routing
 * - Priority classification
 */

import { pipeline } from '@xenova/transformers';
import '../transformers-config'; // Configure for browser environment

export interface ZeroShotClassificationResult {
  text: string;
  labels: string[];
  scores: number[];
  topLabel: string;
  topScore: number;
  executionTimeMs: number;
}

export interface ClassificationExample {
  text: string;
  possibleLabels: string[];
}

let classifier: any = null;

/**
 * Initialize the zero-shot classifier
 */
async function initializeClassifier() {
  if (classifier) return classifier;

  console.log('Loading zero-shot classification model...');
  const startTime = performance.now();

  // Using BART-large-MNLI for zero-shot classification
  classifier = await pipeline(
    'zero-shot-classification',
    'Xenova/bart-large-mnli'
  );

  const loadTime = Math.round(performance.now() - startTime);
  console.log(`Zero-shot model loaded in ${loadTime}ms`);

  return classifier;
}

/**
 * Classify text into one of the provided labels (no training needed!)
 *
 * @example
 * ```typescript
 * const result = await classifyText(
 *   "I need extra towels in room 305",
 *   ["housekeeping", "maintenance", "concierge", "front-desk"]
 * );
 * console.log(result.topLabel); // "housekeeping"
 * console.log(result.topScore); // 0.92
 * ```
 */
export async function classifyText(
  text: string,
  candidateLabels: string[],
  multiLabel: boolean = false
): Promise<ZeroShotClassificationResult> {
  const startTime = performance.now();

  // Initialize classifier
  const model = await initializeClassifier();

  // Run classification
  const result = await model(text, candidateLabels, { multi_label: multiLabel });

  const executionTimeMs = Math.round(performance.now() - startTime);

  return {
    text,
    labels: result.labels,
    scores: result.scores,
    topLabel: result.labels[0],
    topScore: result.scores[0],
    executionTimeMs,
  };
}

/**
 * Batch classify multiple texts
 */
export async function classifyBatch(
  examples: ClassificationExample[]
): Promise<ZeroShotClassificationResult[]> {
  const results: ZeroShotClassificationResult[] = [];

  for (const example of examples) {
    const result = await classifyText(example.text, example.possibleLabels);
    results.push(result);
  }

  return results;
}

/**
 * Classify guest request intent
 */
export async function classifyGuestRequest(text: string) {
  const labels = [
    'new booking',
    'modify reservation',
    'cancel reservation',
    'room service',
    'housekeeping',
    'maintenance issue',
    'concierge service',
    'complaint',
    'general inquiry',
  ];

  return classifyText(text, labels);
}

/**
 * Classify complaint department routing
 */
export async function classifyComplaintDepartment(text: string) {
  const departments = [
    'housekeeping',
    'maintenance',
    'front desk',
    'food and beverage',
    'management',
    'billing',
  ];

  return classifyText(text, departments);
}

/**
 * Classify urgency level
 */
export async function classifyUrgency(text: string) {
  const urgencyLevels = ['emergency', 'urgent', 'normal', 'low priority'];

  return classifyText(text, urgencyLevels);
}

/**
 * Multi-label classification (text can have multiple categories)
 */
export async function classifyMultiLabel(text: string, labels: string[]) {
  return classifyText(text, labels, true);
}

/**
 * Clear cached model (useful for memory management)
 */
export function clearClassifierCache() {
  classifier = null;
}
