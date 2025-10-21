/**
 * Personalized Upsell Recommendations
 */

export interface GuestProfile {
  id: string;
  type: 'business' | 'leisure' | 'family' | 'couple';
  occasion?: 'anniversary' | 'birthday' | 'honeymoon' | 'none';
  budget: 'economy' | 'mid-range' | 'luxury';
  previousPurchases: string[];
}

export interface UpsellOffer {
  id: string;
  name: string;
  category: 'room-upgrade' | 'service' | 'dining' | 'amenity';
  price: number;
  description: string;
}

export interface Recommendation {
  offer: UpsellOffer;
  score: number;
  reason: string;
  expectedConversion: number;
}

export interface UpsellResult {
  recommendations: Recommendation[];
  method: 'rule-based' | 'collaborative' | 'neural';
  processingTime?: number;
}

const OFFERS: UpsellOffer[] = [
  { id: '1', name: 'Suite Upgrade', category: 'room-upgrade', price: 80, description: 'Upgrade to ocean view suite' },
  { id: '2', name: 'Late Checkout', category: 'service', price: 40, description: 'Checkout at 2 PM instead of 11 AM' },
  { id: '3', name: 'Spa Package', category: 'service', price: 120, description: 'Couples massage and spa access' },
  { id: '4', name: 'Champagne & Flowers', category: 'amenity', price: 60, description: 'Romance package' },
  { id: '5', name: 'Breakfast Included', category: 'dining', price: 25, description: 'Full breakfast buffet' },
  { id: '6', name: 'Airport Transfer', category: 'service', price: 50, description: 'Private car service' },
];

export function recommendUpsellsRuleBased(profile: GuestProfile): UpsellResult {
  const startTime = Date.now();
  const recommendations: Recommendation[] = [];

  for (const offer of OFFERS) {
    let score = 0.5;
    let reason = '';

    // Business travelers
    if (profile.type === 'business') {
      if (offer.category === 'service') {
        score += 0.3;
        reason = 'Popular with business travelers';
      }
      if (offer.name.includes('Late Checkout')) {
        score += 0.2;
        reason = 'Convenient for meetings';
      }
    }

    // Couples & special occasions
    if (profile.type === 'couple' || profile.occasion !== 'none') {
      if (offer.category === 'room-upgrade') {
        score += 0.3;
        reason = 'Perfect for special occasions';
      }
      if (offer.name.includes('Spa') || offer.name.includes('Champagne')) {
        score += 0.4;
        reason = `Ideal for ${profile.occasion || 'couples'}`;
      }
    }

    // Families
    if (profile.type === 'family') {
      if (offer.name.includes('Breakfast')) {
        score += 0.3;
        reason = 'Family-friendly amenity';
      }
    }

    // Budget consideration
    if (profile.budget === 'luxury') {
      score += 0.2;
    } else if (profile.budget === 'economy' && offer.price > 50) {
      score -= 0.3;
    }

    if (score > 0.5) {
      recommendations.push({
        offer,
        score: Math.min(1, score),
        reason: reason || 'Good value',
        expectedConversion: score * 0.15,
      });
    }
  }

  recommendations.sort((a, b) => b.score - a.score);

  return {
    recommendations: recommendations.slice(0, 3),
    method: 'rule-based',
    processingTime: Date.now() - startTime,
  };
}

export const UPSELL_MODELS = {
  'rule-based': { name: 'Rule-Based', cost: 0, avgLatency: 5, conversion: 0.08, description: 'Profile + occasion matching' },
  'collaborative': { name: 'Collaborative Filtering', cost: 0, avgLatency: 18, conversion: 0.12, description: 'Similar guest purchases' },
  'neural': { name: 'Neural Recommendation', cost: 0, avgLatency: 30, conversion: 0.16, description: 'Deep learning model' },
};
