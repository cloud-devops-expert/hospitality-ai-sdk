/**
 * Text Summarization
 *
 * Automatically summarize long texts (reviews, reports, documents)
 * Uses sshleifer/distilbart-cnn-12-6 via Transformers.js
 *
 * Business Value:
 * - Save time reading long documents
 * - Generate daily briefings automatically
 * - Summarize guest reviews
 * - $0 cost (runs locally)
 * - 95% of BART quality, 6x faster
 *
 * Use Cases:
 * - Review highlights
 * - Shift report summaries
 * - Email summaries
 * - Policy document summaries
 */

import { pipeline } from '@xenova/transformers';
import '../transformers-config'; // Configure for browser environment

export interface SummarizationResult {
  originalText: string;
  summary: string;
  originalLength: number;
  summaryLength: number;
  compressionRatio: number;
  executionTimeMs: number;
}

export interface SummarizationOptions {
  maxLength?: number;
  minLength?: number;
}

let summarizer: any = null;

/**
 * Initialize the summarization model
 */
async function initializeSummarizer() {
  if (summarizer) return summarizer;

  console.log('Loading summarization model...');
  const startTime = performance.now();

  // Using DistilBART (6x faster than BART, 95% quality)
  summarizer = await pipeline(
    'summarization',
    'Xenova/distilbart-cnn-6-6'
  );

  const loadTime = Math.round(performance.now() - startTime);
  console.log(`Summarization model loaded in ${loadTime}ms`);

  return summarizer;
}

/**
 * Summarize a text
 *
 * @example
 * ```typescript
 * const result = await summarizeText(longReview, { maxLength: 100 });
 * console.log(result.summary);
 * console.log(`Compressed by ${result.compressionRatio}%`);
 * ```
 */
export async function summarizeText(
  text: string,
  options: SummarizationOptions = {}
): Promise<SummarizationResult> {
  const startTime = performance.now();

  // Initialize model
  const model = await initializeSummarizer();

  // Set default options
  const maxLength = options.maxLength || 130;
  const minLength = options.minLength || 30;

  // Run summarization
  const result = await model(text, {
    max_length: maxLength,
    min_length: minLength,
  });

  const executionTimeMs = Math.round(performance.now() - startTime);

  const summary = result[0].summary_text;
  const originalLength = text.length;
  const summaryLength = summary.length;
  const compressionRatio = Math.round(((originalLength - summaryLength) / originalLength) * 100);

  return {
    originalText: text,
    summary,
    originalLength,
    summaryLength,
    compressionRatio,
    executionTimeMs,
  };
}

/**
 * Batch summarize multiple texts
 */
export async function summarizeBatch(
  texts: string[],
  options: SummarizationOptions = {}
): Promise<SummarizationResult[]> {
  const results: SummarizationResult[] = [];

  for (const text of texts) {
    const result = await summarizeText(text, options);
    results.push(result);
  }

  return results;
}

/**
 * Summarize guest review
 */
export async function summarizeReview(review: string): Promise<SummarizationResult> {
  return summarizeText(review, { maxLength: 80, minLength: 20 });
}

/**
 * Summarize shift report
 */
export async function summarizeShiftReport(report: string): Promise<SummarizationResult> {
  return summarizeText(report, { maxLength: 150, minLength: 50 });
}

/**
 * Summarize multiple reviews into highlights
 */
export async function summarizeReviewHighlights(reviews: string[]): Promise<string[]> {
  const summaries = await summarizeBatch(reviews, { maxLength: 60, minLength: 20 });
  return summaries.map((s) => s.summary);
}

/**
 * Generate daily briefing from multiple reports
 */
export async function generateDailyBriefing(reports: string[]): Promise<string> {
  // Combine all reports
  const combinedReport = reports.join('\n\n');

  // Summarize the combined report
  const result = await summarizeText(combinedReport, {
    maxLength: 200,
    minLength: 100,
  });

  return result.summary;
}

/**
 * Example guest reviews
 */
export const sampleReviews = [
  `The hotel exceeded our expectations in every way. The room was spacious, impeccably clean, and beautifully decorated. The bed was incredibly comfortable, and we loved the attention to detail with the complimentary toiletries and welcome amenities. The staff went above and beyond to make our stay memorable, particularly the concierge who helped us book last-minute dinner reservations at a fantastic restaurant. The location was perfect - walking distance to all major attractions but quiet enough for a good night's sleep. The breakfast buffet was extensive and delicious. We especially appreciated the fresh pastries and made-to-order omelets. The fitness center was well-equipped, and the pool area was a perfect spot to relax after a day of sightseeing. We will definitely return!`,

  `Very disappointing stay. While the location was convenient, that's about the only positive thing I can say. The room was much smaller than advertised in the photos, and the cleanliness left much to be desired. We found hair in the bathroom and dust on the furniture. The air conditioning was extremely loud and kept us awake most of the night. When we called the front desk to report the issues, they seemed disinterested and didn't offer any solutions. The WiFi barely worked, making it impossible to get any work done. For the price we paid, this was completely unacceptable. The breakfast was mediocre at best - cold eggs and stale pastries. We checked out a day early and won't be returning.`,

  `Decent hotel for a business trip. The room was clean and functional, though not particularly memorable. Check-in was smooth and efficient. The business center had everything I needed, and the WiFi was reliable throughout the property. The bed was comfortable, and I appreciated the blackout curtains for sleeping. The location near the airport was convenient for my early morning flight. Staff was professional but not particularly warm. The gym was small but adequate. Overall, it met my basic needs but didn't exceed expectations. Good value for the price point.`,
];

/**
 * Clear cached model
 */
export function clearSummarizerCache() {
  summarizer = null;
}
