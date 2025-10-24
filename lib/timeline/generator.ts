/**
 * Unified Timeline Generator
 * Collects and aggregates events from all hotel systems
 */

import { v4 as uuid } from 'uuid';
import {
  TimelineEvent,
  TimelineEventType,
  TimelinePriority,
  TimelineFilter,
  TimelineResponse,
} from './types';
import { predictNoShowRuleBased } from '../no-show/traditional';
import { forecastHybrid } from '../forecast/hybrid';

/**
 * Generate timeline events for a date range
 */
export async function generateTimeline(
  filter?: TimelineFilter
): Promise<TimelineResponse> {
  const events: TimelineEvent[] = [];

  // Generate synthetic data for demo
  const bookings = generateSyntheticBookings(30);
  const now = new Date();
  const startDate = filter?.dateRange?.start || now;
  const endDate =
    filter?.dateRange?.end || new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  // 1. Booking events
  bookings.forEach((booking) => {
    if (
      booking.bookedAt >= startDate &&
      booking.bookedAt <= endDate &&
      (!filter?.types || filter.types.includes('booking'))
    ) {
      events.push({
        id: uuid(),
        type: 'booking',
        title: 'New Booking',
        description: `${booking.guestName} booked ${booking.roomType}`,
        timestamp: booking.bookedAt,
        priority: 'low',
        metadata: {
          guestName: booking.guestName,
          roomNumber: booking.roomNumber,
          amount: booking.roomRate,
          bookingId: booking.id,
        },
        icon: '📅',
        color: 'green',
      });
    }
  });

  // 2. Check-in events
  bookings.forEach((booking) => {
    if (
      booking.checkInDate >= startDate &&
      booking.checkInDate <= endDate &&
      (!filter?.types || filter.types.includes('checkin'))
    ) {
      const noShowPrediction = predictNoShowRuleBased(booking);
      const isHighRisk = noShowPrediction.risk === 'high';

      events.push({
        id: uuid(),
        type: 'checkin',
        title: isHighRisk ? 'High-Risk Check-in' : 'Expected Check-in',
        description: `${booking.guestName} - ${booking.roomType}`,
        timestamp: booking.checkInDate,
        priority: isHighRisk ? 'critical' : 'medium',
        metadata: {
          guestName: booking.guestName,
          roomNumber: booking.roomNumber,
          bookingId: booking.id,
          noShowRisk: noShowPrediction.probability,
        },
        actions: isHighRisk
          ? [
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
            ]
          : undefined,
        icon: isHighRisk ? '⚠️' : '🔑',
        color: isHighRisk ? 'red' : 'blue',
      });
    }
  });

  // 3. Check-out events
  bookings.forEach((booking) => {
    if (
      booking.checkOutDate >= startDate &&
      booking.checkOutDate <= endDate &&
      (!filter?.types || filter.types.includes('checkout'))
    ) {
      events.push({
        id: uuid(),
        type: 'checkout',
        title: 'Expected Check-out',
        description: `${booking.guestName} - Room ${booking.roomNumber}`,
        timestamp: booking.checkOutDate,
        priority: 'medium',
        metadata: {
          guestName: booking.guestName,
          roomNumber: booking.roomNumber,
          bookingId: booking.id,
        },
        actions: [
          {
            id: 'prepare-bill',
            label: 'Prepare Bill',
            icon: '💳',
            action: 'prepare-checkout-bill',
            params: { bookingId: booking.id },
            primary: true,
          },
          {
            id: 'schedule-cleaning',
            label: 'Schedule Cleaning',
            icon: '🧹',
            action: 'schedule-housekeeping',
            params: { roomNumber: booking.roomNumber },
          },
        ],
        icon: '🚪',
        color: 'purple',
      });
    }
  });

  // 4. VIP arrival events
  bookings.forEach((booking) => {
    if (
      booking.checkInDate >= startDate &&
      booking.checkInDate <= endDate &&
      (booking.roomType === 'Suite' || booking.previousStays > 5) &&
      (!filter?.types || filter.types.includes('vip_arrival'))
    ) {
      events.push({
        id: uuid(),
        type: 'vip_arrival',
        title: 'VIP Arrival',
        description: `${booking.guestName} - ${booking.roomType}${booking.previousStays > 0 ? ` (${booking.previousStays} stays)` : ''}`,
        timestamp: booking.checkInDate,
        priority: 'high',
        metadata: {
          guestName: booking.guestName,
          roomNumber: booking.roomNumber,
          previousStays: booking.previousStays,
          bookingId: booking.id,
        },
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
            id: 'upgrade-room',
            label: 'Upgrade Room',
            icon: '⭐',
            action: 'upgrade-room',
            params: { bookingId: booking.id },
          },
        ],
        icon: '⭐',
        color: 'yellow',
      });
    }
  });

  // 5. Maintenance events
  const maintenanceEvents = generateMaintenanceEvents(startDate, endDate);
  if (!filter?.types || filter.types.includes('maintenance')) {
    events.push(...maintenanceEvents);
  }

  // 6. Housekeeping events
  const housekeepingEvents = generateHousekeepingEvents(startDate, endDate);
  if (!filter?.types || filter.types.includes('housekeeping')) {
    events.push(...housekeepingEvents);
  }

  // 7. Review events
  const reviewEvents = generateReviewEvents(startDate, endDate);
  if (!filter?.types || filter.types.includes('review')) {
    events.push(...reviewEvents);
  }

  // Sort by timestamp (most recent first)
  events.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

  // Apply search filter
  let filteredEvents = events;
  if (filter?.searchQuery) {
    const query = filter.searchQuery.toLowerCase();
    filteredEvents = events.filter(
      (event) =>
        event.title.toLowerCase().includes(query) ||
        event.description.toLowerCase().includes(query) ||
        event.metadata?.guestName?.toLowerCase().includes(query) ||
        event.metadata?.roomNumber?.toLowerCase().includes(query)
    );
  }

  // Apply priority filter
  if (filter?.priorities && filter.priorities.length > 0) {
    filteredEvents = filteredEvents.filter((event) =>
      filter.priorities!.includes(event.priority)
    );
  }

  return {
    events: filteredEvents,
    totalCount: filteredEvents.length,
    hasMore: false,
  };
}

/**
 * Generate maintenance events
 */
function generateMaintenanceEvents(
  startDate: Date,
  endDate: Date
): TimelineEvent[] {
  const events: TimelineEvent[] = [];
  const maintenanceItems = [
    {
      title: 'HVAC Filter Replacement',
      room: '301',
      priority: 'medium' as TimelinePriority,
    },
    {
      title: 'Plumbing Leak Repair',
      room: '215',
      priority: 'high' as TimelinePriority,
    },
    {
      title: 'Light Bulb Replacement',
      room: '408',
      priority: 'low' as TimelinePriority,
    },
    {
      title: 'Elevator Inspection',
      room: 'Lobby',
      priority: 'high' as TimelinePriority,
    },
  ];

  maintenanceItems.forEach((item, i) => {
    const timestamp = new Date(
      startDate.getTime() + Math.random() * (endDate.getTime() - startDate.getTime())
    );
    events.push({
      id: uuid(),
      type: 'maintenance',
      title: item.title,
      description: `Scheduled maintenance - ${item.room}`,
      timestamp,
      priority: item.priority,
      metadata: {
        roomNumber: item.room,
        category: 'preventive',
      },
      actions: [
        {
          id: 'assign-staff',
          label: 'Assign Staff',
          icon: '👷',
          action: 'assign-maintenance',
          params: { maintenanceId: uuid() },
          primary: true,
        },
        {
          id: 'mark-complete',
          label: 'Mark Complete',
          icon: '✓',
          action: 'complete-maintenance',
          params: { maintenanceId: uuid() },
        },
      ],
      icon: '🔧',
      color: 'orange',
    });
  });

  return events;
}

/**
 * Generate housekeeping events
 */
function generateHousekeepingEvents(
  startDate: Date,
  endDate: Date
): TimelineEvent[] {
  const events: TimelineEvent[] = [];
  const rooms = ['201', '202', '305', '312', '410', '415'];

  rooms.forEach((room) => {
    const timestamp = new Date(
      startDate.getTime() + Math.random() * (endDate.getTime() - startDate.getTime())
    );
    events.push({
      id: uuid(),
      type: 'housekeeping',
      title: 'Room Cleaning Scheduled',
      description: `Room ${room} - Deep clean`,
      timestamp,
      priority: 'low',
      metadata: {
        roomNumber: room,
        assignedTo: ['Maria', 'Sarah', 'Lisa'][Math.floor(Math.random() * 3)],
      },
      actions: [
        {
          id: 'view-status',
          label: 'View Status',
          icon: '📋',
          action: 'view-cleaning-status',
          params: { roomNumber: room },
          primary: true,
        },
      ],
      icon: '🧹',
      color: 'teal',
    });
  });

  return events;
}

/**
 * Generate review events
 */
function generateReviewEvents(
  startDate: Date,
  endDate: Date
): TimelineEvent[] {
  const events: TimelineEvent[] = [];
  const reviews = [
    { guest: 'John Smith', rating: 5, sentiment: 'positive' },
    { guest: 'Emily Davis', rating: 4, sentiment: 'positive' },
    { guest: 'Michael Brown', rating: 2, sentiment: 'negative' },
  ];

  reviews.forEach((review) => {
    const timestamp = new Date(
      startDate.getTime() + Math.random() * (endDate.getTime() - startDate.getTime())
    );
    const isNegative = review.sentiment === 'negative';

    events.push({
      id: uuid(),
      type: 'review',
      title: `New Review: ${review.rating}/5`,
      description: `${review.guest} left a ${review.sentiment} review`,
      timestamp,
      priority: isNegative ? 'high' : 'low',
      metadata: {
        guestName: review.guest,
        rating: review.rating,
        sentiment: review.sentiment,
      },
      actions: [
        {
          id: 'respond',
          label: 'Respond',
          icon: '💬',
          action: 'respond-to-review',
          params: { reviewId: uuid() },
          primary: true,
        },
        {
          id: 'view-full',
          label: 'View Full',
          icon: '👁️',
          action: 'view-review',
          params: { reviewId: uuid() },
        },
      ],
      icon: isNegative ? '⭐' : '⭐',
      color: isNegative ? 'red' : 'green',
    });
  });

  return events;
}

// Helper function (same as in briefing/generator.ts)
function generateSyntheticBookings(count: number) {
  const names = [
    'John Smith',
    'Emily Johnson',
    'Michael Brown',
    'Sarah Davis',
    'James Wilson',
    'Emma Garcia',
    'David Martinez',
    'Olivia Anderson',
  ];
  const roomTypes = ['Standard', 'Deluxe', 'Suite'];
  const sources = ['direct', 'ota', 'agent'] as const;
  const payments = ['credit_card', 'cash', 'invoice'] as const;
  const now = Date.now();

  return Array.from({ length: count }, (_, i) => {
    const checkInOffset = (Math.random() - 0.3) * 7 * 24 * 60 * 60 * 1000;
    const bookedOffset = checkInOffset - Math.random() * 30 * 24 * 60 * 60 * 1000;

    return {
      id: `BOOK-${i + 1}`,
      guestName: names[Math.floor(Math.random() * names.length)],
      roomType: roomTypes[Math.floor(Math.random() * roomTypes.length)],
      roomNumber: `${Math.floor(Math.random() * 4) + 1}${Math.floor(Math.random() * 20) + 1}`,
      checkInDate: new Date(now + checkInOffset),
      checkOutDate: new Date(now + checkInOffset + Math.random() * 7 * 24 * 60 * 60 * 1000),
      bookedAt: new Date(now + bookedOffset),
      roomRate: 100 + Math.random() * 200,
      daysBeforeArrival: Math.abs(checkInOffset / (24 * 60 * 60 * 1000)),
      leadTime: Math.abs(bookedOffset / (24 * 60 * 60 * 1000)),
      previousStays: Math.floor(Math.random() * 10),
      previousNoShows: Math.floor(Math.random() * 2),
      hasDeposit: Math.random() > 0.4,
      source: sources[Math.floor(Math.random() * sources.length)],
      paymentMethod: payments[Math.floor(Math.random() * payments.length)],
      seasonalIndex: 0.5 + Math.random() * 0.5,
    };
  });
}
