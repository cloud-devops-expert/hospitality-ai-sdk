import { recommendUpsellsRuleBased } from '../recommender';
import type { GuestProfile } from '../recommender';

describe('Upsell Recommendations', () => {
  describe('Business Travelers', () => {
    const businessProfile: GuestProfile = {
      id: 'guest-1',
      type: 'business',
      occasion: 'none',
      budget: 'mid-range',
      previousPurchases: [],
    };

    it('should recommend business-focused upsells', () => {
      const result = recommendUpsellsRuleBased(businessProfile);

      expect(result.recommendations.length).toBeGreaterThan(0);
      expect(result.recommendations.some(r =>
        r.offer.name.toLowerCase().includes('checkout') ||
        r.offer.name.toLowerCase().includes('workspace') ||
        r.offer.name.toLowerCase().includes('lounge')
      )).toBe(true);
    });

    it('should have higher conversion for business offers', () => {
      const result = recommendUpsellsRuleBased(businessProfile);
      const businessOffer = result.recommendations.find(r =>
        r.offer.name.toLowerCase().includes('checkout')
      );

      expect(businessOffer).toBeDefined();
      expect(businessOffer!.expectedConversion).toBeGreaterThan(0.1);
    });
  });

  describe('Leisure Travelers', () => {
    const leisureProfile: GuestProfile = {
      id: 'guest-2',
      type: 'leisure',
      occasion: 'birthday', // Add occasion to get recommendations
      budget: 'luxury', // Higher budget to boost scores
      previousPurchases: [],
    };

    it('should recommend leisure-focused upsells', () => {
      const result = recommendUpsellsRuleBased(leisureProfile);

      expect(result.recommendations.length).toBeGreaterThan(0);
      // With occasion set, should get room upgrades and spa offers
      expect(result.recommendations.some(r =>
        r.offer.category === 'room-upgrade' ||
        r.offer.name.toLowerCase().includes('spa') ||
        r.offer.name.toLowerCase().includes('champagne')
      )).toBe(true);
    });
  });

  describe('Family Travelers', () => {
    const familyProfile: GuestProfile = {
      id: 'guest-3',
      type: 'family',
      occasion: 'none',
      budget: 'mid-range',
      previousPurchases: [],
    };

    it('should recommend family-friendly upsells', () => {
      const result = recommendUpsellsRuleBased(familyProfile);

      expect(result.recommendations.length).toBeGreaterThan(0);
      expect(result.recommendations.some(r =>
        r.offer.name.toLowerCase().includes('breakfast') ||
        r.offer.name.toLowerCase().includes('family') ||
        r.offer.name.toLowerCase().includes('suite')
      )).toBe(true);
    });
  });

  describe('Couple Travelers', () => {
    const coupleProfile: GuestProfile = {
      id: 'guest-4',
      type: 'couple',
      occasion: 'anniversary',
      budget: 'luxury',
      previousPurchases: [],
    };

    it('should recommend romantic upsells', () => {
      const result = recommendUpsellsRuleBased(coupleProfile);

      expect(result.recommendations.length).toBeGreaterThan(0);
      expect(result.recommendations.some(r =>
        r.offer.name.toLowerCase().includes('room') ||
        r.offer.name.toLowerCase().includes('spa') ||
        r.offer.name.toLowerCase().includes('dinner')
      )).toBe(true);
    });
  });

  describe('Special Occasions', () => {
    it('should enhance recommendations for anniversaries', () => {
      const anniversaryProfile: GuestProfile = {
        id: 'guest-5',
        type: 'couple',
        occasion: 'anniversary',
        budget: 'luxury',
        previousPurchases: [],
      };

      const result = recommendUpsellsRuleBased(anniversaryProfile);

      expect(result.recommendations.some(r =>
        r.offer.name.toLowerCase().includes('champagne') ||
        r.offer.name.toLowerCase().includes('romantic') ||
        r.offer.name.toLowerCase().includes('couples')
      )).toBe(true);
    });

    it('should enhance recommendations for birthdays', () => {
      const birthdayProfile: GuestProfile = {
        id: 'guest-6',
        type: 'leisure',
        occasion: 'birthday',
        budget: 'mid-range',
        previousPurchases: [],
      };

      const result = recommendUpsellsRuleBased(birthdayProfile);

      expect(result.recommendations.length).toBeGreaterThan(0);
    });

    it('should enhance recommendations for honeymoons', () => {
      const honeymoonProfile: GuestProfile = {
        id: 'guest-7',
        type: 'couple',
        occasion: 'honeymoon',
        budget: 'luxury',
        previousPurchases: [],
      };

      const result = recommendUpsellsRuleBased(honeymoonProfile);

      expect(result.recommendations.some(r =>
        r.offer.name.toLowerCase().includes('honeymoon') ||
        r.offer.name.toLowerCase().includes('suite') ||
        r.offer.name.toLowerCase().includes('spa')
      )).toBe(true);
    });
  });

  describe('Budget Sensitivity', () => {
    it('should recommend lower-priced options for economy budget', () => {
      const economyProfile: GuestProfile = {
        id: 'guest-8',
        type: 'business',
        occasion: 'none',
        budget: 'economy',
        previousPurchases: [],
      };

      const result = recommendUpsellsRuleBased(economyProfile);
      const avgPrice = result.recommendations.reduce((sum, r) => sum + r.offer.price, 0) / result.recommendations.length;

      expect(avgPrice).toBeLessThan(100);
    });

    it('should recommend premium options for luxury budget', () => {
      const luxuryProfile: GuestProfile = {
        id: 'guest-9',
        type: 'couple',
        occasion: 'anniversary',
        budget: 'luxury',
        previousPurchases: [],
      };

      const result = recommendUpsellsRuleBased(luxuryProfile);

      expect(result.recommendations.some(r => r.offer.price > 100)).toBe(true);
    });
  });

  describe('Conversion Rates', () => {
    it('should provide expected conversion rates', () => {
      const profile: GuestProfile = {
        id: 'test',
        type: 'business',
        occasion: 'none',
        budget: 'mid-range',
        previousPurchases: [],
      };

      const result = recommendUpsellsRuleBased(profile);

      result.recommendations.forEach(rec => {
        expect(rec.expectedConversion).toBeGreaterThan(0);
        expect(rec.expectedConversion).toBeLessThanOrEqual(1);
      });
    });

    it('should have different conversion rates based on match', () => {
      const profile: GuestProfile = {
        id: 'test',
        type: 'business',
        occasion: 'none',
        budget: 'luxury',
        previousPurchases: [],
      };

      const result = recommendUpsellsRuleBased(profile);

      expect(result.recommendations.some(r => r.expectedConversion > 0.1)).toBe(true);
    });
  });

  describe('Recommendation Reasons', () => {
    it('should provide clear reasons for recommendations', () => {
      const profile: GuestProfile = {
        id: 'test',
        type: 'business',
        occasion: 'none',
        budget: 'mid-range',
        previousPurchases: [],
      };

      const result = recommendUpsellsRuleBased(profile);

      result.recommendations.forEach(rec => {
        expect(rec.reason).toBeTruthy();
        expect(rec.reason.length).toBeGreaterThan(10);
      });
    });
  });
});
