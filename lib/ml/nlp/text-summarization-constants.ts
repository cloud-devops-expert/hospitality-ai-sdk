/**
 * Text Summarization Constants
 *
 * Static data for summarization UI (sample reviews, types, helpers)
 * Extracted from text-summarizer to avoid bundling Transformers.js in browser
 */

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

/**
 * Example guest reviews for testing
 */
export const sampleReviews = [
  `The hotel exceeded our expectations in every way. The room was spacious, impeccably clean, and beautifully decorated. The bed was incredibly comfortable, and we loved the attention to detail with the complimentary toiletries and welcome amenities. The staff went above and beyond to make our stay memorable, particularly the concierge who helped us book last-minute dinner reservations at a fantastic restaurant. The location was perfect - walking distance to all major attractions but quiet enough for a good night's sleep. The breakfast buffet was extensive and delicious. We especially appreciated the fresh pastries and made-to-order omelets. The fitness center was well-equipped, and the pool area was a perfect spot to relax after a day of sightseeing. We will definitely return!`,

  `Very disappointing stay. While the location was convenient, that's about the only positive thing I can say. The room was much smaller than advertised in the photos, and the cleanliness left much to be desired. We found hair in the bathroom and dust on the furniture. The air conditioning was extremely loud and kept us awake most of the night. When we called the front desk to report the issues, they seemed disinterested and didn't offer any solutions. The WiFi barely worked, making it impossible to get any work done. For the price we paid, this was completely unacceptable. The breakfast was mediocre at best - cold eggs and stale pastries. We checked out a day early and won't be returning.`,

  `Decent hotel for a business trip. The room was clean and functional, though not particularly memorable. Check-in was smooth and efficient. The business center had everything I needed, and the WiFi was reliable throughout the property. The bed was comfortable, and I appreciated the blackout curtains for sleeping. The location near the airport was convenient for my early morning flight. Staff was professional but not particularly warm. The gym was small but adequate. Overall, it met my basic needs but didn't exceed expectations. Good value for the price point.`,
];
