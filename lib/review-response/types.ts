/**
 * Review Response Generator Types
 */

export interface Review {
  id: string;
  guestName: string;
  rating: 1 | 2 | 3 | 4 | 5;
  text: string;
  platform: 'google' | 'tripadvisor' | 'booking' | 'expedia';
  date: Date;
  roomType?: string;
  stayDates?: { checkIn: Date; checkOut: Date };
}

export interface ResponseSuggestion {
  reviewId: string;
  draftResponse: string;
  tone: 'professional' | 'warm' | 'apologetic' | 'enthusiastic';
  sentiment: 'positive' | 'negative' | 'mixed' | 'neutral';
  keyTopics: string[];
  confidence: number;
  method: 'template' | 'rag' | 'llm';
  processingTime?: number;
  quality: number; // 0-1
}
