/**
 * No-Show Prediction Types
 */

export interface Booking {
  id: string;
  guestName: string;
  roomType: string;
  checkInDate: Date;
  checkOutDate: Date;
  roomRate: number;
  daysBeforeArrival: number;
  leadTime: number; // Days between booking and check-in
  previousStays?: number;
  previousNoShows?: number;
  paymentMethod?: 'credit_card' | 'cash' | 'invoice';
  hasDeposit?: boolean;
  source?: 'direct' | 'ota' | 'agent';
  seasonalIndex?: number; // 0-1, how busy is the season
}

export interface NoShowPrediction {
  bookingId: string;
  willNoShow: boolean;
  probability: number; // 0-1 probability of no-show
  confidence: number; // Model confidence
  risk: 'low' | 'medium' | 'high';
  factors?: string[]; // Contributing factors
  method: string;
  processingTime?: number;
}

export interface NoShowStats {
  totalBookings: number;
  predictedNoShows: number;
  highRisk: number;
  mediumRisk: number;
  lowRisk: number;
  averageProbability: number;
}
