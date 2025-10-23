/**
 * Natural Language Understanding (NLU)
 * Parse user queries and route to appropriate ML modules
 */

import { QueryIntent } from './types';

/**
 * Parse user query and determine intent
 */
export function parseIntent(query: string): QueryIntent {
  const lowerQuery = query.toLowerCase().trim();

  // Forecast intents
  if (
    /\b(forecast|predict|occupancy|demand|busy|bookings?|next week|weekend|tonight)\b/i.test(
      lowerQuery
    )
  ) {
    return {
      type: 'forecast',
      confidence: 0.9,
      timeframe: extractTimeframe(lowerQuery),
    };
  }

  // Pricing intents
  if (
    /\b(price|pricing|rate|should i (raise|increase|decrease|lower)|how much|charge)\b/i.test(
      lowerQuery
    )
  ) {
    return {
      type: 'pricing',
      confidence: 0.9,
      timeframe: extractTimeframe(lowerQuery),
    };
  }

  // No-show intents
  if (
    /\b(no-?show|likely to show|cancel|high-?risk|won'?t arrive|probability)\b/i.test(
      lowerQuery
    )
  ) {
    return {
      type: 'noshow',
      confidence: 0.9,
      timeframe: extractTimeframe(lowerQuery),
    };
  }

  // Guest segmentation intents
  if (
    /\b(guest|segment|vip|luxury|premium|budget|who are|profile|lifetime value|ltv)\b/i.test(
      lowerQuery
    )
  ) {
    return {
      type: 'segmentation',
      confidence: 0.85,
    };
  }

  // Sentiment intents
  if (
    /\b(review|feedback|sentiment|rating|satisfaction|complaint|happy|unhappy)\b/i.test(
      lowerQuery
    )
  ) {
    return {
      type: 'sentiment',
      confidence: 0.85,
    };
  }

  // Operations intents
  if (
    /\b(housekeeping|clean|room status|maintenance|staff|route|task)\b/i.test(
      lowerQuery
    )
  ) {
    return {
      type: 'operations',
      confidence: 0.85,
    };
  }

  // General/fallback
  return {
    type: 'general',
    confidence: 0.5,
  };
}

/**
 * Extract timeframe from query
 */
function extractTimeframe(query: string): {
  start?: Date;
  end?: Date;
} | undefined {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Tonight
  if (/\b(tonight|today)\b/i.test(query)) {
    return {
      start: today,
      end: new Date(today.getTime() + 24 * 60 * 60 * 1000),
    };
  }

  // Tomorrow
  if (/\b(tomorrow)\b/i.test(query)) {
    const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
    return {
      start: tomorrow,
      end: new Date(tomorrow.getTime() + 24 * 60 * 60 * 1000),
    };
  }

  // This weekend
  if (/\b(weekend|this weekend)\b/i.test(query)) {
    const daysUntilSaturday = (6 - today.getDay() + 7) % 7;
    const saturday = new Date(
      today.getTime() + daysUntilSaturday * 24 * 60 * 60 * 1000
    );
    const monday = new Date(saturday.getTime() + 2 * 24 * 60 * 60 * 1000);
    return {
      start: saturday,
      end: monday,
    };
  }

  // Next week
  if (/\b(next week)\b/i.test(query)) {
    const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    const weekEnd = new Date(nextWeek.getTime() + 7 * 24 * 60 * 60 * 1000);
    return {
      start: nextWeek,
      end: weekEnd,
    };
  }

  return undefined;
}

/**
 * Generate follow-up suggestions based on intent
 */
export function generateSuggestions(intent: QueryIntent): string[] {
  switch (intent.type) {
    case 'forecast':
      return [
        'What should I price rooms at?',
        'Show me high-risk bookings',
        'Which guests are VIPs?',
      ];
    case 'pricing':
      return [
        "What's the occupancy forecast?",
        'Why this price?',
        'Test different pricing strategies',
      ];
    case 'noshow':
      return [
        'Send check-in reminders',
        'Consider overbooking?',
        'Show me guest history',
      ];
    case 'segmentation':
      return [
        'Create targeted offers',
        'Show revenue by segment',
        'Who should I prioritize?',
      ];
    case 'sentiment':
      return [
        'What are common complaints?',
        'Show positive reviews',
        'Which areas need improvement?',
      ];
    case 'operations':
      return [
        'Optimize cleaning routes',
        'Show staff performance',
        'Predict maintenance issues',
      ];
    default:
      return [
        "What's the forecast for this weekend?",
        'Should I raise prices?',
        'Show me guest segments',
      ];
  }
}

/**
 * Format response in natural language
 */
export function formatResponse(
  intent: QueryIntent,
  data: any,
  context?: any
): string {
  switch (intent.type) {
    case 'forecast':
      if (data.occupancy !== undefined) {
        const trend = data.trend || 'stable';
        const vs = data.vsLastYear ? ` (${data.vsLastYear > 0 ? '+' : ''}${data.vsLastYear}% vs last year)` : '';
        return `📊 **${Math.round(data.occupancy)}% occupancy** (±${data.confidence || 3}%)${vs}\n\nTrend: ${trend === 'increasing' ? '📈 Increasing' : trend === 'decreasing' ? '📉 Decreasing' : '➡️ Stable'}`;
      }
      break;

    case 'pricing':
      if (data.recommendedPrice !== undefined) {
        const change = data.currentPrice
          ? ` (${data.recommendedPrice > data.currentPrice ? '+' : ''}$${Math.abs(data.recommendedPrice - data.currentPrice)})`
          : '';
        return `💰 **$${data.recommendedPrice}${change}**\n\n${data.explanation || 'Optimized based on demand forecast'}`;
      }
      break;

    case 'noshow':
      if (Array.isArray(data)) {
        const highRisk = data.filter((b) => b.risk === 'high').length;
        return `🚫 **${highRisk} high-risk bookings** found\n\n${data.length} total bookings analyzed`;
      }
      break;

    case 'segmentation':
      if (data.segments) {
        const top = data.segments[0];
        return `👥 **${top?.name || 'Segment'}** is your largest (${top?.percentage?.toFixed(0) || 0}%)\n\nAverage spend: $${top?.avgSpend?.toFixed(0) || 0}`;
      }
      break;

    default:
      return 'I can help you with occupancy forecasts, pricing recommendations, no-show predictions, guest segmentation, and operations optimization. What would you like to know?';
  }

  return 'Processing your request...';
}
