/**
 * Unified Timeline Types
 * Chronological view of all hotel events
 */

export type TimelineEventType =
  | 'checkin'
  | 'checkout'
  | 'booking'
  | 'cancellation'
  | 'maintenance'
  | 'alert'
  | 'review'
  | 'payment'
  | 'housekeeping'
  | 'vip_arrival'
  | 'no_show'
  | 'pricing_change'
  | 'staff_note';

export type TimelinePriority = 'critical' | 'high' | 'medium' | 'low';

export interface TimelineEvent {
  id: string;
  type: TimelineEventType;
  title: string;
  description: string;
  timestamp: Date;
  priority: TimelinePriority;
  metadata?: {
    guestName?: string;
    roomNumber?: string;
    amount?: number;
    bookingId?: string;
    staffMember?: string;
    [key: string]: any;
  };
  actions?: TimelineAction[];
  icon?: string;
  color?: string;
}

export interface TimelineAction {
  id: string;
  label: string;
  icon?: string;
  action: string;
  params?: Record<string, any>;
  primary?: boolean;
}

export interface TimelineFilter {
  types?: TimelineEventType[];
  priorities?: TimelinePriority[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  searchQuery?: string;
}

export interface TimelineResponse {
  events: TimelineEvent[];
  totalCount: number;
  hasMore: boolean;
  nextCursor?: string;
}
