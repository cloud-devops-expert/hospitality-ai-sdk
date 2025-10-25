/**
 * Query Handler
 * Routes parsed intents to appropriate ML modules and generates responses
 */

import { QueryIntent, AssistantResponse, Message, QuickAction, ConversationContext } from './types';
import { parseIntent, generateSuggestions, formatResponse } from './nlu';
import { forecastHybrid } from '../forecast/hybrid';
import { calculateDynamicPrice } from '../pricing/dynamic';
import { predictNoShowRuleBased } from '../no-show/traditional';
import { segmentGuests, calculateSegmentStats } from '../guests/segmentation';
import { v4 as uuid } from 'uuid';
import type { ForecastResult } from '../forecast/statistical';
import type { NoShowPrediction } from '../no-show/types';

// Response data types from different handlers
type ForecastResponseData = {
  occupancy: number;
  confidence: number;
  trend: string;
  vsLastYear: number;
  forecasts: ForecastResult[];
  visualization?: { type: string; data: any };
  metadata?: any;
};

type PricingResponseData = {
  recommendedPrice: number;
  currentPrice: number;
  confidence: number;
  explanation: string;
  factors: any[];
  visualization?: { type: string; data: any };
  metadata?: any;
};

type NoShowResponseData = {
  totalGuests: number;
  highRisk: number;
  mediumRisk: number;
  lowRisk: number;
  predictions: NoShowPrediction[];
  visualization?: { type: string; data: any };
  metadata?: any;
};

type SegmentationResponseData = {
  segments: unknown[];
  stats: unknown;
  visualization?: { type: string; data: any };
  metadata?: any;
};

type QueryResponseData =
  | ForecastResponseData
  | PricingResponseData
  | NoShowResponseData
  | SegmentationResponseData
  | { result: string; data: unknown; visualization?: any; metadata?: any };

/**
 * Handle user query and generate assistant response
 */
export async function handleQuery(
  query: string,
  context?: ConversationContext
): Promise<AssistantResponse> {
  const startTime = Date.now();

  // Parse intent
  const intent = parseIntent(query);

  // Route to appropriate handler
  let responseData: QueryResponseData | undefined;
  let responseText: string;
  let actions: QuickAction[] = [];

  try {
    switch (intent.type) {
      case 'forecast':
        responseData = await handleForecastQuery(intent, context);
        responseText = formatResponse(intent, responseData, context);
        actions = [
          {
            id: 'adjust-pricing',
            label: 'Adjust Pricing',
            icon: '💰',
            action: 'open-pricing',
            primary: true,
          },
          {
            id: 'see-details',
            label: 'See Details',
            icon: '📊',
            action: 'open-forecast',
          },
        ];
        break;

      case 'pricing': {
        const pricingData = await handlePricingQuery(intent, context);
        responseData = pricingData;
        responseText = formatResponse(intent, responseData, context);
        actions = [
          {
            id: 'apply-price',
            label: `Set $${pricingData.recommendedPrice}`,
            icon: '✓',
            action: 'apply-pricing',
            params: { price: pricingData.recommendedPrice },
            primary: true,
          },
          {
            id: 'what-if',
            label: 'What If?',
            icon: '🔮',
            action: 'open-pricing-simulator',
          },
        ];
        break;
      }

      case 'noshow':
        responseData = await handleNoShowQuery(intent, context);
        responseText = formatResponse(intent, responseData, context);
        actions = [
          {
            id: 'send-reminders',
            label: 'Send Reminders',
            icon: '📧',
            action: 'send-checkin-reminders',
            primary: true,
          },
          {
            id: 'view-list',
            label: 'View List',
            icon: '📋',
            action: 'open-noshow',
          },
        ];
        break;

      case 'segmentation':
        responseData = await handleSegmentationQuery(intent, context);
        responseText = formatResponse(intent, responseData, context);
        actions = [
          {
            id: 'create-offers',
            label: 'Create Offers',
            icon: '🎁',
            action: 'create-segment-offers',
            primary: true,
          },
          {
            id: 'view-segments',
            label: 'View All Segments',
            icon: '👥',
            action: 'open-guests',
          },
        ];
        break;

      default:
        responseText = generateHelpResponse();
        actions = [
          {
            id: 'forecast',
            label: 'Occupancy Forecast',
            icon: '📊',
            action: 'example-forecast',
          },
          {
            id: 'pricing',
            label: 'Pricing Advice',
            icon: '💰',
            action: 'example-pricing',
          },
          {
            id: 'guests',
            label: 'Guest Insights',
            icon: '👥',
            action: 'example-guests',
          },
        ];
    }
  } catch (error) {
    console.error('Query handler error:', error);
    responseText = "I encountered an error processing your request. Please try rephrasing your question.";
  }

  const message: Message = {
    id: uuid(),
    role: 'assistant',
    content: responseText,
    timestamp: new Date(),
    actions,
    visualization: responseData?.visualization,
    metadata: responseData?.metadata,
  };

  const suggestions = generateSuggestions(intent);
  const processingTime = Date.now() - startTime;

  return {
    message,
    intent,
    processingTime,
    suggestions,
  };
}

/**
 * Handle forecast-related queries
 */
async function handleForecastQuery(intent: QueryIntent, context?: ConversationContext): Promise<ForecastResponseData> {
  // Generate synthetic historical data (in production, use real data)
  const historicalData = generateSyntheticHistory(30);

  const forecasts = await forecastHybrid(historicalData, 14);

  // Calculate average occupancy for timeframe
  const relevantForecasts = intent.timeframe
    ? forecasts.filter(
        (f) =>
          (!intent.timeframe!.start || f.date >= intent.timeframe!.start) &&
          (!intent.timeframe!.end || f.date <= intent.timeframe!.end)
      )
    : forecasts.slice(0, 7);

  const avgOccupancy =
    relevantForecasts.reduce((sum, f) => sum + f.predicted, 0) /
    relevantForecasts.length;

  const confidence =
    relevantForecasts.reduce((sum, f) => sum + f.confidence, 0) /
    relevantForecasts.length;

  const trend = relevantForecasts[relevantForecasts.length - 1]?.trend || 'stable';

  return {
    occupancy: avgOccupancy,
    confidence: Math.round(confidence * 100),
    trend,
    vsLastYear: Math.round((Math.random() - 0.3) * 30), // Simulated
    forecasts: relevantForecasts,
    visualization: {
      type: 'chart',
      data: relevantForecasts.map((f) => ({
        date: f.date.toLocaleDateString(),
        occupancy: Math.round(f.predicted),
        confidence: Math.round(f.confidence * 100),
      })),
    },
  };
}

/**
 * Handle pricing-related queries
 */
async function handlePricingQuery(intent: QueryIntent, context?: ConversationContext): Promise<PricingResponseData> {
  const historicalData = generateSyntheticHistory(30);
  const occupancyRate = historicalData[historicalData.length - 1].value / 100;

  const pricing = calculateDynamicPrice({
    baseRate: 150,
    occupancyRate,
    daysUntilArrival: 3,
    seasonalMultiplier: 1.0,
    dayOfWeek: new Date().getDay(),
  });

  return {
    recommendedPrice: Math.round(pricing.suggestedPrice),
    currentPrice: 150,
    confidence: pricing.confidence,
    explanation: `Based on ${Math.round(occupancyRate * 100)}% occupancy and ${pricing.factors.length} factors`,
    factors: pricing.factors,
  };
}

/**
 * Handle no-show related queries
 */
async function handleNoShowQuery(intent: QueryIntent, context?: ConversationContext): Promise<NoShowResponseData> {
  // Generate synthetic bookings
  const bookings = generateSyntheticBookings(20);

  const predictions = bookings.map((booking) =>
    predictNoShowRuleBased(booking)
  );

  const highRisk = predictions.filter((p) => p.risk === 'high');
  const mediumRisk = predictions.filter((p) => p.risk === 'medium');
  const lowRisk = predictions.filter((p) => p.risk === 'low');

  const enrichedPredictions = predictions.map((p, i) => ({
    ...p,
    guestName: bookings[i].guestName,
    roomType: bookings[i].roomType,
    checkInDate: bookings[i].checkInDate,
  }));

  return {
    totalGuests: predictions.length,
    highRisk: highRisk.length,
    mediumRisk: mediumRisk.length,
    lowRisk: lowRisk.length,
    predictions: enrichedPredictions,
  };
}

/**
 * Handle segmentation queries
 */
async function handleSegmentationQuery(intent: QueryIntent, context?: ConversationContext): Promise<SegmentationResponseData> {
  // Generate synthetic guest data
  const guests = generateSyntheticGuests(100);

  const segmentedGuests = await segmentGuests(guests);
  const stats = calculateSegmentStats(segmentedGuests);

  return {
    segments: stats.segments,
    stats: stats,
  };
}

/**
 * Generate help response
 */
function generateHelpResponse(): string {
  return `👋 **Hi! I'm your hotel AI assistant.**

I can help you with:

📊 **Forecasting**: "What's occupancy next weekend?"
💰 **Pricing**: "Should I raise rates for Saturday?"
🚫 **No-Shows**: "Show me high-risk bookings"
👥 **Guests**: "Which guests are VIPs?"
🧹 **Operations**: "Optimize housekeeping routes"

What would you like to know?`;
}

// Helper functions for synthetic data (replace with real data in production)

function generateSyntheticHistory(days: number) {
  const data = [];
  const today = new Date();

  for (let i = days; i > 0; i--) {
    const date = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
    const value = 60 + Math.random() * 30 + Math.sin(i / 7) * 10;
    data.push({ date, value });
  }

  return data;
}

function generateSyntheticBookings(count: number) {
  const names = ['John Smith', 'Emily Johnson', 'Michael Brown', 'Sarah Davis', 'James Wilson'];
  const roomTypes = ['single', 'double', 'suite', 'deluxe'] as const;
  const bookingChannels = ['direct', 'ota', 'phone', 'email', 'corporate'] as const;
  const paymentMethods = ['prepaid', 'pay-at-property', 'corporate-billing'] as const;

  return Array.from({ length: count }, (_, i) => ({
    id: `BOOK-${i + 1}`,
    guestName: names[Math.floor(Math.random() * names.length)],
    roomType: roomTypes[Math.floor(Math.random() * roomTypes.length)],
    checkInDate: new Date(Date.now() + Math.random() * 7 * 24 * 60 * 60 * 1000),
    checkOutDate: new Date(Date.now() + Math.random() * 14 * 24 * 60 * 60 * 1000),
    totalAmount: 100 + Math.random() * 200,
    bookingChannel: bookingChannels[Math.floor(Math.random() * bookingChannels.length)],
    leadTimeDays: Math.floor(Math.random() * 90),
    paymentMethod: paymentMethods[Math.floor(Math.random() * paymentMethods.length)],
    hasSpecialRequests: Math.random() > 0.7,
    guestHistory: Math.random() > 0.5 ? {
      totalStays: Math.floor(Math.random() * 10) + 1,
      noShowCount: Math.floor(Math.random() * 3),
      cancellationCount: Math.floor(Math.random() * 2),
    } : undefined,
  }));
}

function generateSyntheticGuests(count: number) {
  const names = ['Alice', 'Bob', 'Charlie', 'Diana', 'Eve', 'Frank', 'Grace', 'Henry'];

  return Array.from({ length: count }, (_, i) => ({
    id: `GUEST-${i + 1}`,
    name: names[i % names.length] + ' ' + (i + 1),
    email: `guest${i + 1}@example.com`,
    totalStays: 1 + Math.floor(Math.random() * 20),
    totalSpend: 200 + Math.random() * 10000,
    avgRoomRate: 100 + Math.random() * 200,
    avgDaysInAdvance: Math.random() * 60,
    roomUpgrades: Math.floor(Math.random() * 5),
    amenityUsage: Math.random(),
  }));
}
