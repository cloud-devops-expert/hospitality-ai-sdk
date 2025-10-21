/**
 * No-Show Prediction Types
 */

export interface Booking {
  id: string;
  guestName: string;
  checkInDate: Date;
  checkOutDate: Date;
  roomType: 'single' | 'double' | 'suite' | 'deluxe';
  bookingChannel: 'direct' | 'ota' | 'phone' | 'email' | 'corporate';
  leadTimeDays: number;
  totalAmount: number;
  paymentMethod: 'prepaid' | 'pay-at-property' | 'corporate-billing';
  hasSpecialRequests: boolean;
  guestHistory?: {
    totalStays: number;
    noShowCount: number;
    cancellationCount: number;
  };
}

export interface NoShowPrediction {
  bookingId: string;
  probability: number; // 0-1
  riskLevel: 'low' | 'medium' | 'high';
  confidence: number; // 0-1
  reasons: string[];
  recommendedActions: string[];
  method: 'rule-based' | 'logistic-regression' | 'gradient-boosting' | 'llm';
  processingTime?: number;
}
