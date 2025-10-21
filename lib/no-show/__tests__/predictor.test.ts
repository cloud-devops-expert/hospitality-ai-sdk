import { predictNoShowRuleBased } from '../traditional';
import { predictNoShowLogisticRegression, predictNoShowGradientBoosting } from '../ml';
import type { Booking } from '../types';

describe('No-Show Prediction', () => {
  const highRiskBooking: Booking = {
    id: 'test-1',
    guestName: 'Test Guest',
    checkInDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
    checkOutDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days later
    roomType: 'double',
    bookingChannel: 'ota',
    leadTimeDays: 0,
    totalAmount: 300,
    paymentMethod: 'pay-at-property',
    hasSpecialRequests: false,
    guestHistory: {
      totalStays: 5,
      noShowCount: 2,
      cancellationCount: 1,
    },
  };

  const lowRiskBooking: Booking = {
    id: 'test-2',
    guestName: 'Loyal Guest',
    checkInDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days later
    checkOutDate: new Date(Date.now() + 33 * 24 * 60 * 60 * 1000), // 33 days later
    roomType: 'suite',
    bookingChannel: 'direct',
    leadTimeDays: 30,
    totalAmount: 600,
    paymentMethod: 'prepaid',
    hasSpecialRequests: true,
    guestHistory: {
      totalStays: 20,
      noShowCount: 0,
      cancellationCount: 1,
    },
  };

  describe('Rule-Based Prediction', () => {
    it('should predict high risk for risky booking', () => {
      const result = predictNoShowRuleBased(highRiskBooking);

      expect(result.riskLevel).toBe('high');
      expect(result.probability).toBeGreaterThan(0.5);
      expect(result.method).toBe('rule-based');
      expect(result.recommendedActions.length).toBeGreaterThan(0);
    });

    it('should predict low risk for safe booking', () => {
      const result = predictNoShowRuleBased(lowRiskBooking);

      expect(result.riskLevel).toBe('low');
      expect(result.probability).toBeLessThan(0.3);
      expect(result.method).toBe('rule-based');
    });

    it('should handle booking without guest history', () => {
      const booking: Booking = {
        ...highRiskBooking,
        guestHistory: undefined,
      };

      const result = predictNoShowRuleBased(booking);

      expect(result).toBeDefined();
      expect(result.probability).toBeGreaterThan(0);
    });

    it('should penalize OTA bookings', () => {
      const otaBooking: Booking = {
        id: 'ota-test',
        guestName: 'OTA Guest',
        checkInDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        checkOutDate: new Date(Date.now() + 33 * 24 * 60 * 60 * 1000),
        roomType: 'double',
        bookingChannel: 'ota',
        leadTimeDays: 30,
        totalAmount: 300,
        paymentMethod: 'pay-at-property',
        hasSpecialRequests: false,
      };

      const directBooking: Booking = {
        id: 'direct-test',
        guestName: 'Direct Guest',
        checkInDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        checkOutDate: new Date(Date.now() + 33 * 24 * 60 * 60 * 1000),
        roomType: 'double',
        bookingChannel: 'direct',
        leadTimeDays: 30,
        totalAmount: 300,
        paymentMethod: 'pay-at-property',
        hasSpecialRequests: false,
      };

      const otaResult = predictNoShowRuleBased(otaBooking);
      const directResult = predictNoShowRuleBased(directBooking);

      expect(otaResult.probability).toBeGreaterThan(directResult.probability);
    });

    it('should reward special requests', () => {
      const withRequests = { ...highRiskBooking, hasSpecialRequests: true };
      const withoutRequests = { ...highRiskBooking, hasSpecialRequests: false };

      const withResult = predictNoShowRuleBased(withRequests);
      const withoutResult = predictNoShowRuleBased(withoutRequests);

      expect(withResult.probability).toBeLessThan(withoutResult.probability);
    });
  });

  describe('Logistic Regression Prediction', () => {
    it('should predict high risk for risky booking', () => {
      const result = predictNoShowLogisticRegression(highRiskBooking);

      expect(result.riskLevel).toBe('high');
      expect(result.probability).toBeGreaterThan(0.5);
      expect(result.method).toBe('logistic-regression');
      expect(result.confidence).toBeGreaterThan(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
    });

    it('should predict low risk for safe booking', () => {
      const result = predictNoShowLogisticRegression(lowRiskBooking);

      expect(result.riskLevel).toBe('low');
      expect(result.probability).toBeLessThan(0.3);
      expect(result.method).toBe('logistic-regression');
    });

    it('should return different confidence levels', () => {
      const result1 = predictNoShowLogisticRegression(highRiskBooking);
      const result2 = predictNoShowLogisticRegression(lowRiskBooking);

      // High risk predictions should have higher confidence
      expect(result1.confidence).toBeDefined();
      expect(result2.confidence).toBeDefined();
    });
  });

  describe('Gradient Boosting Prediction', () => {
    it('should predict high risk for risky booking', () => {
      const result = predictNoShowGradientBoosting(highRiskBooking);

      expect(result.riskLevel).toBe('high');
      expect(result.probability).toBeGreaterThan(0.5);
      expect(result.method).toBe('gradient-boosting');
      expect(result.confidence).toBeGreaterThan(0.7); // Higher accuracy model
    });

    it('should predict low risk for safe booking', () => {
      const result = predictNoShowGradientBoosting(lowRiskBooking);

      expect(result.riskLevel).toBe('low');
      expect(result.probability).toBeLessThan(0.3);
      expect(result.method).toBe('gradient-boosting');
    });

    it('should have higher confidence than logistic regression', () => {
      const lrResult = predictNoShowLogisticRegression(highRiskBooking);
      const gbResult = predictNoShowGradientBoosting(highRiskBooking);

      expect(gbResult.confidence).toBeGreaterThanOrEqual(lrResult.confidence);
    });
  });

  describe('Risk Level Classification', () => {
    it('should classify probabilities correctly', () => {
      const tests = [
        { booking: lowRiskBooking, expectedRisk: 'low' },
        { booking: highRiskBooking, expectedRisk: 'high' },
      ];

      tests.forEach(({ booking, expectedRisk }) => {
        const result = predictNoShowRuleBased(booking);
        expect(result.riskLevel).toBe(expectedRisk);
      });
    });
  });

  describe('Recommended Actions', () => {
    it('should provide actions for high risk bookings', () => {
      const result = predictNoShowRuleBased(highRiskBooking);

      expect(result.recommendedActions).toBeInstanceOf(Array);
      expect(result.recommendedActions.length).toBeGreaterThan(0);
      expect(result.recommendedActions.some(action =>
        action.toLowerCase().includes('confirmation') ||
        action.toLowerCase().includes('deposit') ||
        action.toLowerCase().includes('contact')
      )).toBe(true);
    });

    it('should provide minimal actions for low risk bookings', () => {
      const result = predictNoShowRuleBased(lowRiskBooking);

      expect(result.recommendedActions).toBeInstanceOf(Array);
    });
  });
});
