/**
 * Daily Briefing Generator
 * Analyzes hotel data and generates proactive insights
 */

import { DailyBriefing, BriefingAlert, BriefingSummary } from './types';
import { forecastHybrid } from '../forecast/hybrid';
import { predictNoShowRuleBased } from '../no-show/traditional';
import { v4 as uuid } from 'uuid';

/**
 * Generate daily briefing with alerts and insights
 */
export async function generateDailyBriefing(
  hotelData?: any
): Promise<DailyBriefing> {
  const now = new Date();
  const greeting = getGreeting(now);

  // Generate synthetic data for demo (replace with real data)
  const bookings = generateSyntheticBookings(25);
  const occupancyData = generateSyntheticHistory(30);

  // Analyze data
  const alerts: BriefingAlert[] = [];

  // 1. Check for high-risk no-shows
  const noShowAlerts = await analyzeNoShows(bookings);
  alerts.push(...noShowAlerts);

  // 2. Check for VIP arrivals
  const vipAlerts = await analyzeVIPArrivals(bookings);
  alerts.push(...vipAlerts);

  // 3. Check pricing opportunities
  const pricingAlerts = await analyzePricingOpportunities(occupancyData);
  alerts.push(...pricingAlerts);

  // 4. Check operations
  const opsAlerts = await analyzeOperations();
  alerts.push(...opsAlerts);

  // Sort alerts by priority
  alerts.sort((a, b) => {
    const priority = { critical: 0, important: 1, fyi: 2 };
    return priority[a.type] - priority[b.type];
  });

  // Generate summary
  const summary: BriefingSummary = {
    arrivals: bookings.filter((b) => isToday(b.checkInDate)).length,
    departures: bookings.filter((b) => isToday(b.checkOutDate)).length,
    occupancy: occupancyData[occupancyData.length - 1].value,
    revenue: 4250,
    vipGuests: vipAlerts.length,
    highRiskNoShows: noShowAlerts.length,
  };

  // Generate insights
  const insights = generateInsights(summary, alerts);

  return {
    date: now,
    greeting,
    summary,
    alerts,
    insights,
    generatedAt: now,
  };
}

/**
 * Analyze bookings for high-risk no-shows
 */
async function analyzeNoShows(bookings: any[]): Promise<BriefingAlert[]> {
  const alerts: BriefingAlert[] = [];

  const todayBookings = bookings.filter((b) => isToday(b.checkInDate));

  for (const booking of todayBookings) {
    const prediction = predictNoShowRuleBased(booking);

    if (prediction.risk === 'high') {
      alerts.push({
        id: uuid(),
        type: 'critical',
        category: 'noshow',
        title: `High-Risk No-Show: ${booking.roomType}`,
        description: `${booking.guestName} - ${Math.round(prediction.probability * 100)}% probability`,
        impact: `Potential revenue loss: $${booking.roomRate.toFixed(0)}`,
        actions: [
          {
            id: 'send-reminder',
            label: 'Send Reminder',
            icon: '📧',
            action: 'send-checkin-reminder',
            params: { bookingId: booking.id },
            primary: true,
          },
          {
            id: 'call-guest',
            label: 'Call Guest',
            icon: '📞',
            action: 'call-guest',
            params: { bookingId: booking.id },
          },
          {
            id: 'snooze',
            label: 'Snooze',
            icon: '⏰',
            action: 'snooze-alert',
            params: { alertId: booking.id },
          },
        ],
        timestamp: new Date(),
        metadata: {
          bookingId: booking.id,
          probability: prediction.probability,
          factors: prediction.reasons,
        },
      });
    }
  }

  return alerts;
}

/**
 * Analyze for VIP arrivals
 */
async function analyzeVIPArrivals(bookings: any[]): Promise<BriefingAlert[]> {
  const alerts: BriefingAlert[] = [];

  const vipBookings = bookings.filter(
    (b) =>
      isToday(b.checkInDate) &&
      (b.roomType === 'Suite' || b.previousStays > 5)
  );

  for (const booking of vipBookings) {
    alerts.push({
      id: uuid(),
      type: 'important',
      category: 'vip',
      title: `VIP Arrival: ${booking.roomType}`,
      description: `${booking.guestName}${booking.previousStays ? ` - Returning guest (${booking.previousStays} stays)` : ''}`,
      impact: 'High-value guest requiring special attention',
      actions: [
        {
          id: 'prepare-welcome',
          label: 'Prepare Welcome',
          icon: '🎁',
          action: 'prepare-vip-welcome',
          params: { bookingId: booking.id },
          primary: true,
        },
        {
          id: 'check-notes',
          label: 'Check Notes',
          icon: '📋',
          action: 'view-guest-notes',
          params: { guestId: booking.guestName },
        },
        {
          id: 'done',
          label: 'Mark Done',
          icon: '✓',
          action: 'mark-done',
          params: { alertId: booking.id },
        },
      ],
      timestamp: new Date(),
      metadata: {
        bookingId: booking.id,
        previousStays: booking.previousStays || 0,
      },
    });
  }

  return alerts;
}

/**
 * Analyze pricing opportunities
 */
async function analyzePricingOpportunities(
  occupancyData: any[]
): Promise<BriefingAlert[]> {
  const alerts: BriefingAlert[] = [];

  // Get weekend forecast
  const forecasts = await forecastHybrid(occupancyData, 7);
  const weekendForecasts = forecasts.filter((f) => {
    const day = f.date.getDay();
    return day === 5 || day === 6; // Friday, Saturday
  });

  for (const forecast of weekendForecasts) {
    if (forecast.predicted > 85 && forecast.confidence > 0.8) {
      const dayName = forecast.date.toLocaleDateString('en-US', {
        weekday: 'long',
      });
      const increase = 30;

      alerts.push({
        id: uuid(),
        type: 'important',
        category: 'pricing',
        title: `Pricing Opportunity: ${dayName}`,
        description: `${Math.round(forecast.predicted)}% forecasted occupancy - high demand detected`,
        impact: `Potential revenue increase: +$${increase * 10}/night`,
        actions: [
          {
            id: 'adjust-pricing',
            label: `Increase by $${increase}`,
            icon: '💰',
            action: 'adjust-pricing',
            params: {
              date: forecast.date,
              adjustment: increase,
            },
            primary: true,
          },
          {
            id: 'see-forecast',
            label: 'See Forecast',
            icon: '📊',
            action: 'open-forecast',
          },
          {
            id: 'skip',
            label: 'Skip',
            icon: '→',
            action: 'skip-alert',
            params: { alertId: uuid() },
          },
        ],
        timestamp: new Date(),
        metadata: {
          forecast: forecast.predicted,
          confidence: forecast.confidence,
        },
      });
    }
  }

  return alerts;
}

/**
 * Analyze operations
 */
async function analyzeOperations(): Promise<BriefingAlert[]> {
  const alerts: BriefingAlert[] = [];

  // Simulated operations alert
  if (Math.random() > 0.7) {
    alerts.push({
      id: uuid(),
      type: 'fyi',
      category: 'operations',
      title: 'Housekeeping Optimization',
      description: 'Route optimization can save 35 minutes today',
      impact: 'Improved efficiency for 8 rooms',
      actions: [
        {
          id: 'apply-route',
          label: 'Apply Route',
          icon: '🧹',
          action: 'apply-housekeeping-route',
          primary: true,
        },
        {
          id: 'view-details',
          label: 'View Details',
          icon: '📋',
          action: 'open-operations',
        },
      ],
      timestamp: new Date(),
    });
  }

  return alerts;
}

/**
 * Generate insights based on summary and alerts
 */
function generateInsights(
  summary: BriefingSummary,
  alerts: BriefingAlert[]
): string[] {
  const insights: string[] = [];

  if (summary.occupancy > 85) {
    insights.push(
      `🔥 High occupancy today (${Math.round(summary.occupancy)}%) - consider premium pricing`
    );
  }

  if (summary.highRiskNoShows > 0) {
    insights.push(
      `⚠️ ${summary.highRiskNoShows} high-risk no-show${summary.highRiskNoShows > 1 ? 's' : ''} require attention`
    );
  }

  if (summary.vipGuests > 0) {
    insights.push(
      `⭐ ${summary.vipGuests} VIP guest${summary.vipGuests > 1 ? 's' : ''} arriving today`
    );
  }

  const pricingAlerts = alerts.filter((a) => a.category === 'pricing');
  if (pricingAlerts.length > 0) {
    insights.push(
      `💰 ${pricingAlerts.length} pricing opportunity${pricingAlerts.length > 1 ? 'ies' : 'y'} identified`
    );
  }

  if (insights.length === 0) {
    insights.push('✅ All systems running smoothly - no urgent action needed');
  }

  return insights;
}

/**
 * Get time-appropriate greeting
 */
function getGreeting(date: Date): string {
  const hour = date.getHours();
  const name = 'there'; // Replace with actual user name

  if (hour < 12) {
    return `🌅 Good morning, ${name}!`;
  } else if (hour < 18) {
    return `☀️ Good afternoon, ${name}!`;
  } else {
    return `🌙 Good evening, ${name}!`;
  }
}

/**
 * Check if date is today
 */
function isToday(date: Date): boolean {
  const today = new Date();
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
}

// Helper functions (same as in query-handler.ts)
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
  const names = [
    'John Smith',
    'Emily Johnson',
    'Michael Brown',
    'Sarah Davis',
    'James Wilson',
  ];
  const roomTypes = ['Standard', 'Deluxe', 'Suite'];
  const sources = ['direct', 'ota', 'agent'] as const;
  const payments = ['credit_card', 'cash', 'invoice'] as const;

  return Array.from({ length: count }, (_, i) => ({
    id: `BOOK-${i + 1}`,
    guestName: names[Math.floor(Math.random() * names.length)],
    roomType: roomTypes[Math.floor(Math.random() * roomTypes.length)],
    checkInDate: new Date(
      Date.now() + (Math.random() - 0.3) * 3 * 24 * 60 * 60 * 1000
    ),
    checkOutDate: new Date(
      Date.now() + Math.random() * 7 * 24 * 60 * 60 * 1000
    ),
    roomRate: 100 + Math.random() * 200,
    daysBeforeArrival: Math.random() * 5,
    leadTime: Math.random() * 30,
    previousStays: Math.floor(Math.random() * 10),
    previousNoShows: Math.floor(Math.random() * 2),
    hasDeposit: Math.random() > 0.4,
    source: sources[Math.floor(Math.random() * sources.length)],
    paymentMethod: payments[Math.floor(Math.random() * payments.length)],
    seasonalIndex: 0.5 + Math.random() * 0.5,
  }));
}
