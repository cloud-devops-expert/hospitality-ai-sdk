/**
 * Daily Briefing Types
 * Proactive intelligence delivered every morning
 */

export interface BriefingAlert {
  id: string;
  type: 'critical' | 'important' | 'fyi';
  category: 'noshow' | 'vip' | 'pricing' | 'operations' | 'review' | 'revenue';
  title: string;
  description: string;
  impact?: string;
  actions: BriefingAction[];
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface BriefingAction {
  id: string;
  label: string;
  icon?: string;
  action: string;
  params?: Record<string, any>;
  primary?: boolean;
}

export interface DailyBriefing {
  date: Date;
  greeting: string;
  summary: BriefingSummary;
  alerts: BriefingAlert[];
  insights: string[];
  generatedAt: Date;
}

export interface BriefingSummary {
  arrivals: number;
  departures: number;
  occupancy: number;
  revenue: number;
  vipGuests: number;
  highRiskNoShows: number;
}
