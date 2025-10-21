import { generateResponseTemplate } from '../generator';
import type { Review } from '../types';

describe('Review Response Generator', () => {
  describe('Positive Reviews', () => {
    const positiveReview: Review = {
      id: 'rev-1',
      guestName: 'John Smith',
      rating: 5,
      text: 'Amazing stay! The staff was incredibly helpful and the room was spotless. Great location too!',
      platform: 'google',
    };

    it('should generate enthusiastic response for 5-star review', () => {
      const result = generateResponseTemplate(positiveReview);

      expect(result.tone).toBe('enthusiastic');
      expect(result.sentiment).toBe('positive');
      expect(result.draftResponse).toContain('John Smith');
      expect(result.quality).toBeGreaterThan(0.6);
    });

    it('should detect positive topics', () => {
      const result = generateResponseTemplate(positiveReview);

      expect(result.keyTopics).toContain('staff');
      expect(result.keyTopics).toContain('cleanliness');
      expect(result.keyTopics).toContain('location');
    });

    it('should handle 4-star reviews', () => {
      const fourStarReview = { ...positiveReview, rating: 4 as const };
      const result = generateResponseTemplate(fourStarReview);

      expect(result.tone).toBe('warm');
      expect(result.sentiment).toBe('positive');
    });
  });

  describe('Negative Reviews', () => {
    const negativeReview: Review = {
      id: 'rev-2',
      guestName: 'Jane Doe',
      rating: 2,
      text: 'Disappointed with the room condition. It was dirty and the amenities were poor. Staff was unhelpful.',
      platform: 'tripadvisor',
    };

    it('should generate apologetic response for low-star review', () => {
      const result = generateResponseTemplate(negativeReview);

      expect(result.tone).toBe('apologetic');
      expect(result.sentiment).toBe('negative');
      expect(result.draftResponse).toContain('Jane Doe');
      expect(result.draftResponse.toLowerCase()).toContain('apolog');
    });

    it('should detect negative topics', () => {
      const result = generateResponseTemplate(negativeReview);

      expect(result.keyTopics).toContain('cleanliness');
      expect(result.keyTopics).toContain('staff');
      expect(result.keyTopics).toContain('amenities');
    });

    it('should handle 1-star reviews', () => {
      const oneStarReview = { ...negativeReview, rating: 1 as const };
      const result = generateResponseTemplate(oneStarReview);

      expect(result.tone).toBe('apologetic');
      expect(result.sentiment).toBe('negative');
    });
  });

  describe('Mixed Reviews', () => {
    const mixedReview: Review = {
      id: 'rev-3',
      guestName: 'Bob Johnson',
      rating: 3,
      text: 'Good location and friendly staff, but the room needs updating and breakfast options were limited.',
      platform: 'booking',
    };

    it('should generate professional response for 3-star review', () => {
      const result = generateResponseTemplate(mixedReview);

      expect(result.tone).toBe('professional');
      expect(result.sentiment).toBe('mixed');
      expect(result.draftResponse).toContain('Bob Johnson');
    });

    it('should detect both positive and negative topics', () => {
      const result = generateResponseTemplate(mixedReview);

      expect(result.keyTopics).toContain('location');
      expect(result.keyTopics).toContain('staff');
      expect(result.keyTopics).toContain('room');
      expect(result.keyTopics).toContain('food');
    });
  });

  describe('Topic Detection', () => {
    it('should detect staff-related topics', () => {
      const review: Review = {
        id: 'test',
        guestName: 'Test',
        rating: 5,
        text: 'The staff was amazing and very helpful',
        platform: 'google',
      };

      const result = generateResponseTemplate(review);
      expect(result.keyTopics).toContain('staff');
    });

    it('should detect cleanliness topics', () => {
      const review: Review = {
        id: 'test',
        guestName: 'Test',
        rating: 5,
        text: 'Room was spotless and very clean',
        platform: 'google',
      };

      const result = generateResponseTemplate(review);
      expect(result.keyTopics).toContain('cleanliness');
    });

    it('should detect multiple topics', () => {
      const review: Review = {
        id: 'test',
        guestName: 'Test',
        rating: 5,
        text: 'Great location, clean room, friendly staff, and excellent food',
        platform: 'google',
      };

      const result = generateResponseTemplate(review);
      expect(result.keyTopics.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('Platform Handling', () => {
    const review: Review = {
      id: 'test',
      guestName: 'Test Guest',
      rating: 5,
      text: 'Great stay!',
      platform: 'expedia',
    };

    it('should handle different platforms', () => {
      const platforms: Array<Review['platform']> = ['google', 'tripadvisor', 'booking', 'expedia'];

      platforms.forEach(platform => {
        const platformReview = { ...review, platform };
        const result = generateResponseTemplate(platformReview);

        expect(result).toBeDefined();
        expect(result.draftResponse).toBeTruthy();
      });
    });
  });

  describe('Quality Scoring', () => {
    it('should provide quality score', () => {
      const review: Review = {
        id: 'test',
        guestName: 'Test',
        rating: 5,
        text: 'Excellent service',
        platform: 'google',
      };

      const result = generateResponseTemplate(review);

      expect(result.quality).toBeGreaterThanOrEqual(0);
      expect(result.quality).toBeLessThanOrEqual(1);
    });

    it('should have consistent quality for template-based responses', () => {
      const review1: Review = {
        id: 'test1',
        guestName: 'Test1',
        rating: 5,
        text: 'Great!',
        platform: 'google',
      };

      const review2: Review = {
        id: 'test2',
        guestName: 'Test2',
        rating: 5,
        text: 'Amazing!',
        platform: 'google',
      };

      const result1 = generateResponseTemplate(review1);
      const result2 = generateResponseTemplate(review2);

      expect(result1.quality).toBe(result2.quality);
    });
  });
});
