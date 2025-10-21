/**
 * Review Response Generator
 * Template-based, RAG, and LLM approaches
 */

import { Review, ResponseSuggestion } from './types';

const POSITIVE_TEMPLATES = [
  "Thank you so much for your wonderful review, {name}! We're thrilled to hear you enjoyed {highlights}. Your feedback means the world to us, and we can't wait to welcome you back soon!",
  "Dear {name}, we're delighted you had such a great experience! {highlights_sentence} Thank you for choosing us, and we look forward to hosting you again!",
  "What a joy to read your review, {name}! We're so pleased that {highlights}. Our team works hard to provide excellent service, and your kind words are truly appreciated.",
];

const NEGATIVE_TEMPLATES = [
  "Dear {name}, we sincerely apologize for your experience with {issues}. This falls short of our standards, and we'd like to make it right. Please contact us directly so we can address your concerns.",
  "Thank you for bringing this to our attention, {name}. We're very sorry that {issues}. We take your feedback seriously and are working to improve. We'd appreciate the opportunity to discuss this further.",
  "{name}, we're disappointed to hear about {issues}. This doesn't reflect the experience we strive to provide. Please reach out so we can resolve this and regain your trust.",
];

const MIXED_TEMPLATES = [
  "Thank you for your feedback, {name}. We're glad you enjoyed {positives}, and we apologize for {negatives}. We're actively working on improvements and hope to provide a better experience next time.",
  "Dear {name}, we appreciate your honest review. It's wonderful that {positives}, but we're sorry about {negatives}. Your insights help us improve our service.",
];

export function generateResponseTemplate(review: Review): ResponseSuggestion {
  const startTime = Date.now();

  const text = review.text.toLowerCase();
  const rating = review.rating;

  // Detect key topics
  const keyTopics: string[] = [];
  if (text.includes('staff') || text.includes('service')) keyTopics.push('service');
  if (text.includes('clean')) keyTopics.push('cleanliness');
  if (text.includes('location') || text.includes('central')) keyTopics.push('location');
  if (text.includes('room') || text.includes('bed')) keyTopics.push('room');
  if (text.includes('food') || text.includes('breakfast')) keyTopics.push('food');
  if (text.includes('wifi') || text.includes('internet')) keyTopics.push('amenities');

  // Determine sentiment
  let sentiment: ResponseSuggestion['sentiment'];
  if (rating >= 4) sentiment = 'positive';
  else if (rating <= 2) sentiment = 'negative';
  else sentiment = 'mixed';

  // Select template
  let templates: string[];
  let tone: ResponseSuggestion['tone'];

  if (sentiment === 'positive') {
    templates = POSITIVE_TEMPLATES;
    tone = 'enthusiastic';
  } else if (sentiment === 'negative') {
    templates = NEGATIVE_TEMPLATES;
    tone = 'apologetic';
  } else {
    templates = MIXED_TEMPLATES;
    tone = 'professional';
  }

  const template = templates[Math.floor(Math.random() * templates.length)];

  // Fill in template
  const highlights = keyTopics.length > 0 ? keyTopics.join(', ') : 'your stay';
  const draftResponse = template
    .replace('{name}', review.guestName)
    .replace('{highlights}', highlights)
    .replace('{highlights_sentence}', `Especially your comments about ${highlights}!`)
    .replace('{issues}', keyTopics.length > 0 ? keyTopics.join(' and ') : 'the issues you experienced')
    .replace('{positives}', keyTopics.slice(0, 2).join(' and '))
    .replace('{negatives}', keyTopics.slice(2).join(' and '));

  return {
    reviewId: review.id,
    draftResponse,
    tone,
    sentiment,
    keyTopics,
    confidence: 0.7,
    method: 'template',
    processingTime: Date.now() - startTime,
    quality: 0.65,
  };
}

export interface ResponseModel {
  name: string;
  cost: number;
  avgLatency: number;
  quality: number;
  description: string;
}

export const RESPONSE_MODELS: Record<string, ResponseModel> = {
  'template': {
    name: 'Template-Based',
    cost: 0,
    avgLatency: 5,
    quality: 0.65,
    description: 'Keyword matching + curated templates',
  },
  'rag': {
    name: 'RAG Enhanced',
    cost: 0.02,
    avgLatency: 600,
    quality: 0.82,
    description: 'Template + AI personalization',
  },
  'llm': {
    name: 'Full LLM',
    cost: 0.08,
    avgLatency: 1200,
    quality: 0.93,
    description: 'Complete AI-generated response',
  },
};
