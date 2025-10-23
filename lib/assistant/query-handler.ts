/**
 * Query Handler
 * Routes parsed intents to appropriate ML modules and generates responses
 */

import { QueryIntent, AssistantResponse, Message, QuickAction } from './types';
import { parseIntent, generateSuggestions, formatResponse } from './nlu';
import { forecastHybrid } from '../forecast/hybrid';
import { calculateDynamicPrice } from '../pricing/dynamic';
import { predictNoShowCustom } from '../noshow/prediction';
import { segmentGuests, calculateSegmentStats } from '../guests/segmentation';
import { v4 as uuid } from 'uuid';

/**
 * Handle user query and generate assistant response
 */
export async function handleQuery(
  query: string,
  context?: any
): Promise<AssistantResponse> {
  const startTime = Date.now();

  // Parse intent
  const intent = parseIntent(query);

  // Route to appropriate handler
  let responseData: any;
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

      case 'pricing':
        responseData = await handlePricingQuery(intent, context);
        responseText = formatResponse(intent, responseData, context);
        actions = [
          {
            id: 'apply-price',
            label: `Set $${responseData.recommendedPrice}`,
            icon: '✓',
            action: 'apply-pricing',
            params: { price: responseData.recommendedPrice },
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
async function handleForecastQuery(intent: QueryIntent, context: any) {
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
async function handlePricingQuery(intent: QueryIntent, context: any) {
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
async function handleNoShowQuery(intent: QueryIntent, context: any) {
  // Generate synthetic bookings
  const bookings = generateSyntheticBookings(20);

  const predictions = bookings.map((booking) =>
    predictNoShowCustom(booking)
  );

  const highRisk = predictions.filter((p) => p.risk === 'high');

  return predictions.map((p, i) => ({
    ...p,
    guestName: bookings[i].guestName,
    roomType: bookings[i].roomType,
    checkInDate: bookings[i].checkInDate,
  }));
}

/**
 * Handle segmentation queries
 */
async function handleSegmentationQuery(intent: QueryIntent, context: any) {
  // Generate synthetic guest data
  const guests = generateSyntheticGuests(100);

  const segmentedGuests = await segmentGuests(guests);
  const stats = calculateSegmentStats(segmentedGuests);

  return {
    segments: stats.segments,
    totalGuests: stats.totalGuests,
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
  const roomTypes = ['Standard', 'Deluxe', 'Suite'];
  const sources = ['direct', 'ota', 'agent'] as const;
  const payments = ['credit_card', 'cash', 'invoice'] as const;

  return Array.from({ length: count }, (_, i) => ({
    id: `BOOK-${i + 1}`,
    guestName: names[Math.floor(Math.random() * names.length)],
    roomType: roomTypes[Math.floor(Math.random() * roomTypes.length)],
    checkInDate: new Date(Date.now() + Math.random() * 7 * 24 * 60 * 60 * 1000),
    checkOutDate: new Date(Date.now() + Math.random() * 14 * 24 * 60 * 60 * 1000),
    roomRate: 100 + Math.random() * 200,
    daysBeforeArrival: Math.random() * 30,
    leadTime: Math.random() * 90,
    previousNoShows: Math.floor(Math.random() * 3),
    hasDeposit: Math.random() > 0.3,
    source: sources[Math.floor(Math.random() * sources.length)],
    paymentMethod: payments[Math.floor(Math.random() * payments.length)],
    seasonalIndex: 0.5 + Math.random() * 0.5,
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
