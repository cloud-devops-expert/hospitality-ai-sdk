/**
 * Question Answering Constants
 *
 * Static data for question answering UI (policies, types, helpers)
 * Extracted from question-answering to avoid bundling Transformers.js in browser
 */

export interface QuestionAnswerResult {
  question: string;
  context: string;
  answer: string;
  score: number;
  startIndex: number;
  endIndex: number;
  executionTimeMs: number;
  confidence: 'high' | 'medium' | 'low';
}

export interface QuestionContext {
  title: string;
  content: string;
}

/**
 * Hotel-specific policy documents
 */
export const hotelPolicies: QuestionContext[] = [
  {
    title: 'Check-in and Check-out',
    content: `
      Check-in time is 3:00 PM and check-out time is 11:00 AM.
      Early check-in is subject to availability at no extra charge.
      Late check-out until 2:00 PM is available for $50.
      Late check-out after 2:00 PM will incur a full night's charge.
    `,
  },
  {
    title: 'Cancellation Policy',
    content: `
      Free cancellation up to 48 hours before arrival.
      Cancellations within 48 hours will incur a one-night charge.
      No-shows will be charged the full reservation amount.
      Non-refundable rates cannot be cancelled or modified.
    `,
  },
  {
    title: 'Pet Policy',
    content: `
      We welcome pets under 50 lbs.
      Pet fee is $75 per night, non-refundable.
      Maximum of 2 pets per room.
      Pets must be kept on leash in public areas.
      Service animals are always welcome at no charge.
    `,
  },
  {
    title: 'Parking and Transportation',
    content: `
      Self-parking is available for $35 per day.
      Valet parking is available for $55 per day.
      Electric vehicle charging stations are complimentary.
      Airport shuttle runs every hour from 6 AM to 10 PM, free for guests.
    `,
  },
  {
    title: 'Amenities',
    content: `
      Complimentary WiFi throughout the property.
      Fitness center open 24/7.
      Pool hours are 6 AM to 10 PM.
      Business center available 24/7.
      Breakfast served daily from 6:30 AM to 10:30 AM.
    `,
  },
  {
    title: 'Room Service',
    content: `
      In-room dining available 24 hours.
      Breakfast in bed available 6:30 AM to 11:00 AM.
      Delivery time is typically 30-45 minutes.
      $5 delivery fee applies to all orders.
      Minimum order of $20 required.
    `,
  },
];

/**
 * Helper function to determine confidence color
 */
export function getConfidenceColor(confidence: 'high' | 'medium' | 'low'): string {
  switch (confidence) {
    case 'high':
      return 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20';
    case 'medium':
      return 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20';
    case 'low':
      return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20';
    default:
      return 'text-gray-600 dark:text-gray-400';
  }
}
