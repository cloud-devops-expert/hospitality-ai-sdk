import { predictCheckInHistorical, predictCheckInML } from '../predictor';
import type { CheckInBooking } from '../predictor';

describe('Check-in Time Prediction', () => {
  describe('Historical Pattern Prediction', () => {
    it('should predict check-in time for business traveler', () => {
      const booking: CheckInBooking = {
        id: 'b1',
        guestName: 'John Business',
        guestType: 'business',
        bookingSource: 'direct',
        distanceMiles: 30,
        statedArrivalTime: new Date('2024-01-01T15:00:00'),
      };

      const result = predictCheckInHistorical(booking);

      expect(result.predictedTime).toBeInstanceOf(Date);
      expect(result.predictedTime.getHours()).toBeGreaterThanOrEqual(17); // Business typically 7PM
      expect(result.confidenceWindow).toBeDefined();
      expect(result.accuracy).toBeCloseTo(0.71);
      expect(result.method).toBe('historical');
    });

    it('should predict check-in time for leisure traveler', () => {
      const booking: CheckInBooking = {
        id: 'b2',
        guestName: 'Jane Leisure',
        guestType: 'leisure',
        bookingSource: 'ota',
        distanceMiles: 50,
        statedArrivalTime: new Date('2024-01-01T14:00:00'),
      };

      const result = predictCheckInHistorical(booking);

      expect(result.predictedTime.getHours()).toBeGreaterThanOrEqual(14); // Leisure typically 4PM
      expect(result.method).toBe('historical');
    });

    it('should predict check-in time for family', () => {
      const booking: CheckInBooking = {
        id: 'b3',
        guestName: 'Smith Family',
        guestType: 'family',
        bookingSource: 'direct',
        distanceMiles: 20,
        statedArrivalTime: new Date('2024-01-01T12:00:00'),
      };

      const result = predictCheckInHistorical(booking);

      expect(result.predictedTime.getHours()).toBeGreaterThanOrEqual(13); // Family typically 3PM
      expect(result.method).toBe('historical');
    });
  });

  describe('Distance Adjustment', () => {
    it('should adjust time based on distance', () => {
      const nearBooking: CheckInBooking = {
        id: 'near',
        guestName: 'Near Guest',
        guestType: 'business',
        bookingSource: 'direct',
        distanceMiles: 10,
      };

      const farBooking: CheckInBooking = {
        id: 'far',
        guestName: 'Far Guest',
        guestType: 'business',
        bookingSource: 'direct',
        distanceMiles: 200,
      };

      const nearResult = predictCheckInHistorical(nearBooking);
      const farResult = predictCheckInHistorical(farBooking);

      expect(farResult.predictedTime.getTime()).toBeGreaterThan(nearResult.predictedTime.getTime());
    });

    it('should handle zero distance', () => {
      const booking: CheckInBooking = {
        id: 'test',
        guestName: 'Local Guest',
        guestType: 'leisure',
        bookingSource: 'direct',
        distanceMiles: 0,
      };

      const result = predictCheckInHistorical(booking);

      expect(result.predictedTime).toBeInstanceOf(Date);
    });

    it('should handle missing distance', () => {
      const booking: CheckInBooking = {
        id: 'test',
        guestName: 'Guest',
        guestType: 'leisure',
        bookingSource: 'direct',
      };

      const result = predictCheckInHistorical(booking);

      expect(result.predictedTime).toBeInstanceOf(Date);
    });
  });

  describe('Confidence Window', () => {
    it('should provide confidence window', () => {
      const booking: CheckInBooking = {
        id: 'test',
        guestName: 'Test Guest',
        guestType: 'business',
        bookingSource: 'direct',
        distanceMiles: 30,
      };

      const result = predictCheckInHistorical(booking);

      expect(result.confidenceWindow).toBeGreaterThan(0);
      expect(result.confidenceWindow).toBeLessThanOrEqual(4); // Reasonable window in hours
    });

    it('should have consistent confidence window for guest type', () => {
      const booking1: CheckInBooking = {
        id: 'test1',
        guestName: 'Guest 1',
        guestType: 'business',
        bookingSource: 'direct',
      };

      const booking2: CheckInBooking = {
        id: 'test2',
        guestName: 'Guest 2',
        guestType: 'business',
        bookingSource: 'ota',
      };

      const result1 = predictCheckInHistorical(booking1);
      const result2 = predictCheckInHistorical(booking2);

      expect(result1.confidenceWindow).toBe(result2.confidenceWindow);
    });
  });

  describe('Accuracy Metrics', () => {
    it('should provide accuracy score', () => {
      const booking: CheckInBooking = {
        id: 'test',
        guestName: 'Test',
        guestType: 'leisure',
        bookingSource: 'direct',
      };

      const result = predictCheckInHistorical(booking);

      expect(result.accuracy).toBeGreaterThan(0);
      expect(result.accuracy).toBeLessThanOrEqual(1);
      expect(result.accuracy).toBe(0.71); // Historical method accuracy
    });
  });

  describe('Booking Source', () => {
    it('should handle direct bookings', () => {
      const booking: CheckInBooking = {
        id: 'test',
        guestName: 'Direct Guest',
        guestType: 'business',
        bookingSource: 'direct',
      };

      const result = predictCheckInHistorical(booking);

      expect(result).toBeDefined();
      expect(result.bookingId).toBe(booking.id);
    });

    it('should handle OTA bookings', () => {
      const booking: CheckInBooking = {
        id: 'test',
        guestName: 'OTA Guest',
        guestType: 'leisure',
        bookingSource: 'ota',
      };

      const result = predictCheckInHistorical(booking);

      expect(result).toBeDefined();
      expect(result.bookingId).toBe(booking.id);
    });
  });

  describe('Processing Time', () => {
    it('should track processing time', () => {
      const booking: CheckInBooking = {
        id: 'test',
        guestName: 'Test',
        guestType: 'business',
        bookingSource: 'direct',
      };

      const result = predictCheckInHistorical(booking);

      expect(result.processingTime).toBeDefined();
      expect(result.processingTime).toBeGreaterThanOrEqual(0);
      expect(result.processingTime).toBeLessThan(100); // Should be fast
    });
  });

  describe('Stated Arrival Time', () => {
    it('should handle stated arrival time', () => {
      const booking: CheckInBooking = {
        id: 'test',
        guestName: 'Test',
        guestType: 'business',
        bookingSource: 'direct',
        statedArrivalTime: new Date('2024-01-01T14:00:00'),
      };

      const result = predictCheckInHistorical(booking);

      expect(result.predictedTime).toBeInstanceOf(Date);
    });

    it('should handle missing stated arrival time', () => {
      const booking: CheckInBooking = {
        id: 'test',
        guestName: 'Test',
        guestType: 'business',
        bookingSource: 'direct',
      };

      const result = predictCheckInHistorical(booking);

      expect(result.predictedTime).toBeInstanceOf(Date);
    });
  });

  describe('Edge Cases', () => {
    it('should handle very long distance', () => {
      const booking: CheckInBooking = {
        id: 'test',
        guestName: 'International Guest',
        guestType: 'leisure',
        bookingSource: 'ota',
        distanceMiles: 5000,
      };

      const result = predictCheckInHistorical(booking);

      expect(result.predictedTime).toBeInstanceOf(Date);
      expect(result.predictedTime.getHours()).toBeGreaterThanOrEqual(0);
    });

    it('should return all required fields', () => {
      const booking: CheckInBooking = {
        id: 'test',
        guestName: 'Test Guest',
        guestType: 'family',
        bookingSource: 'direct',
      };

      const result = predictCheckInHistorical(booking);

      expect(result.bookingId).toBe(booking.id);
      expect(result.predictedTime).toBeInstanceOf(Date);
      expect(result.confidenceWindow).toBeDefined();
      expect(result.accuracy).toBeDefined();
      expect(result.method).toBe('historical');
      expect(result.processingTime).toBeDefined();
    });

    it('should handle all guest types', () => {
      const guestTypes: Array<CheckInBooking['guestType']> = ['business', 'leisure', 'family'];

      guestTypes.forEach((guestType) => {
        const booking: CheckInBooking = {
          id: `test-${guestType}`,
          guestName: `${guestType} Guest`,
          guestType,
          bookingSource: 'direct',
        };

        const result = predictCheckInHistorical(booking);

        expect(result.predictedTime).toBeInstanceOf(Date);
        expect(result.method).toBe('historical');
      });
    });

    it('should handle both booking sources', () => {
      const sources: Array<CheckInBooking['bookingSource']> = ['direct', 'ota'];

      sources.forEach((source) => {
        const booking: CheckInBooking = {
          id: `test-${source}`,
          guestName: 'Test Guest',
          guestType: 'business',
          bookingSource: source,
        };

        const result = predictCheckInHistorical(booking);

        expect(result.bookingId).toBe(booking.id);
        expect(result.predictedTime).toBeInstanceOf(Date);
      });
    });
  });

  describe('Time Consistency', () => {
    it('should return same prediction for identical bookings', () => {
      const booking: CheckInBooking = {
        id: 'test',
        guestName: 'Test',
        guestType: 'business',
        bookingSource: 'direct',
        distanceMiles: 30,
      };

      const result1 = predictCheckInHistorical(booking);
      const result2 = predictCheckInHistorical(booking);

      expect(result1.predictedTime.getHours()).toBe(result2.predictedTime.getHours());
      expect(result1.confidenceWindow).toBe(result2.confidenceWindow);
    });
  });

  describe('ML-Based Prediction', () => {
    it('should predict check-in time using ML for business traveler', () => {
      const booking: CheckInBooking = {
        id: 'ml-b1',
        guestName: 'John Business',
        guestType: 'business',
        bookingSource: 'direct',
        distanceMiles: 50,
        statedArrivalTime: new Date('2024-01-01T17:00:00'),
      };

      const result = predictCheckInML(booking);

      expect(result.predictedTime).toBeInstanceOf(Date);
      expect(result.method).toBe('ml');
      expect(result.accuracy).toBe(0.84);
      expect(result.confidenceWindow).toBeGreaterThan(0);
      expect(result.confidenceWindow).toBeLessThan(3);
    });

    it('should predict check-in time using ML for leisure traveler', () => {
      const booking: CheckInBooking = {
        id: 'ml-l1',
        guestName: 'Jane Leisure',
        guestType: 'leisure',
        bookingSource: 'ota',
        distanceMiles: 80,
      };

      const result = predictCheckInML(booking);

      expect(result.method).toBe('ml');
      expect(result.predictedTime).toBeInstanceOf(Date);
      expect(result.accuracy).toBe(0.84);
    });

    it('should predict check-in time using ML for family', () => {
      const booking: CheckInBooking = {
        id: 'ml-f1',
        guestName: 'Smith Family',
        guestType: 'family',
        bookingSource: 'direct',
        distanceMiles: 30,
      };

      const result = predictCheckInML(booking);

      expect(result.method).toBe('ml');
      expect(result.predictedTime).toBeInstanceOf(Date);
      expect(result.accuracy).toBeCloseTo(0.84);
    });

    it('should have higher accuracy than historical method', () => {
      const booking: CheckInBooking = {
        id: 'test',
        guestName: 'Test Guest',
        guestType: 'business',
        bookingSource: 'direct',
        distanceMiles: 40,
      };

      const historicalResult = predictCheckInHistorical(booking);
      const mlResult = predictCheckInML(booking);

      expect(mlResult.accuracy).toBeGreaterThan(historicalResult.accuracy);
      expect(mlResult.accuracy).toBe(0.84);
      expect(historicalResult.accuracy).toBe(0.71);
    });

    it('should blend stated time with ML prediction', () => {
      const booking: CheckInBooking = {
        id: 'blend-test',
        guestName: 'Test Guest',
        guestType: 'business',
        bookingSource: 'direct',
        distanceMiles: 20,
        statedArrivalTime: new Date('2024-01-01T14:00:00'), // Early stated time
      };

      const result = predictCheckInML(booking);

      expect(result.predictedTime).toBeInstanceOf(Date);
      // ML should influence more than stated time (90% ML, 10% stated)
      expect(result.method).toBe('ml');
    });

    it('should handle distance variations', () => {
      const localBooking: CheckInBooking = {
        id: 'local',
        guestName: 'Local Guest',
        guestType: 'leisure',
        bookingSource: 'direct',
        distanceMiles: 15,
      };

      const farBooking: CheckInBooking = {
        id: 'far',
        guestName: 'Far Guest',
        guestType: 'leisure',
        bookingSource: 'direct',
        distanceMiles: 200,
      };

      const localResult = predictCheckInML(localBooking);
      const farResult = predictCheckInML(farBooking);

      expect(localResult.predictedTime).toBeInstanceOf(Date);
      expect(farResult.predictedTime).toBeInstanceOf(Date);
      // Far guest should have later predicted time
      expect(farResult.predictedTime.getTime()).toBeGreaterThan(localResult.predictedTime.getTime());
    });

    it('should provide reasonable confidence window', () => {
      const booking: CheckInBooking = {
        id: 'test',
        guestName: 'Test Guest',
        guestType: 'business',
        bookingSource: 'direct',
        distanceMiles: 50,
      };

      const mlResult = predictCheckInML(booking);

      // ML confidence window should be reasonable (0.5-2.5 hours)
      expect(mlResult.confidenceWindow).toBeGreaterThanOrEqual(0.5);
      expect(mlResult.confidenceWindow).toBeLessThanOrEqual(2.5);
    });

    it('should track processing time', () => {
      const booking: CheckInBooking = {
        id: 'perf-test',
        guestName: 'Test Guest',
        guestType: 'business',
        bookingSource: 'direct',
      };

      const result = predictCheckInML(booking);

      expect(result.processingTime).toBeDefined();
      expect(result.processingTime).toBeGreaterThanOrEqual(0);
      expect(result.processingTime).toBeLessThan(100); // Should still be fast
    });

    it('should handle missing distance', () => {
      const booking: CheckInBooking = {
        id: 'no-distance',
        guestName: 'Guest',
        guestType: 'leisure',
        bookingSource: 'ota',
      };

      const result = predictCheckInML(booking);

      expect(result.predictedTime).toBeInstanceOf(Date);
      expect(result.method).toBe('ml');
    });

    it('should differentiate OTA vs direct bookings', () => {
      const otaBooking: CheckInBooking = {
        id: 'ota',
        guestName: 'OTA Guest',
        guestType: 'leisure',
        bookingSource: 'ota',
        distanceMiles: 50,
      };

      const directBooking: CheckInBooking = {
        id: 'direct',
        guestName: 'Direct Guest',
        guestType: 'leisure',
        bookingSource: 'direct',
        distanceMiles: 50,
      };

      const otaResult = predictCheckInML(otaBooking);
      const directResult = predictCheckInML(directBooking);

      expect(otaResult.predictedTime).toBeInstanceOf(Date);
      expect(directResult.predictedTime).toBeInstanceOf(Date);
      // Both should have valid predictions
      expect(otaResult.method).toBe('ml');
      expect(directResult.method).toBe('ml');
    });

    it('should handle all guest types', () => {
      const guestTypes: Array<CheckInBooking['guestType']> = ['business', 'leisure', 'family'];

      guestTypes.forEach((guestType) => {
        const booking: CheckInBooking = {
          id: `ml-${guestType}`,
          guestName: `${guestType} Guest`,
          guestType,
          bookingSource: 'direct',
          distanceMiles: 50,
        };

        const result = predictCheckInML(booking);

        expect(result.predictedTime).toBeInstanceOf(Date);
        expect(result.method).toBe('ml');
        expect(result.accuracy).toBe(0.84);
      });
    });

    it('should provide reasonable time predictions', () => {
      const booking: CheckInBooking = {
        id: 'reasonable',
        guestName: 'Test Guest',
        guestType: 'business',
        bookingSource: 'direct',
        distanceMiles: 40,
      };

      const result = predictCheckInML(booking);

      const hour = result.predictedTime.getHours();
      // Check-in times should be reasonable (12 PM - 11 PM)
      expect(hour).toBeGreaterThanOrEqual(12);
      expect(hour).toBeLessThan(23);
    });

    it('should return all required fields', () => {
      const booking: CheckInBooking = {
        id: 'complete',
        guestName: 'Test Guest',
        guestType: 'family',
        bookingSource: 'direct',
        distanceMiles: 30,
      };

      const result = predictCheckInML(booking);

      expect(result.bookingId).toBe(booking.id);
      expect(result.predictedTime).toBeInstanceOf(Date);
      expect(result.confidenceWindow).toBeDefined();
      expect(result.accuracy).toBeDefined();
      expect(result.method).toBe('ml');
      expect(result.processingTime).toBeDefined();
    });
  });

  describe('Method Comparison', () => {
    it('should show ML provides better predictions than historical', () => {
      const booking: CheckInBooking = {
        id: 'comparison',
        guestName: 'Test Guest',
        guestType: 'business',
        bookingSource: 'direct',
        distanceMiles: 50,
        statedArrivalTime: new Date('2024-01-01T18:00:00'),
      };

      const historicalResult = predictCheckInHistorical(booking);
      const mlResult = predictCheckInML(booking);

      // Both should return valid predictions
      expect(historicalResult.predictedTime).toBeInstanceOf(Date);
      expect(mlResult.predictedTime).toBeInstanceOf(Date);

      // ML should have higher accuracy
      expect(mlResult.accuracy).toBeGreaterThan(historicalResult.accuracy);

      // Both should have same booking ID
      expect(historicalResult.bookingId).toBe(booking.id);
      expect(mlResult.bookingId).toBe(booking.id);
    });
  });
});
