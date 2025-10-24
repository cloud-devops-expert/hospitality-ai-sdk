/**
 * Bar Dispenser Integration Types
 *
 * Smart beverage dispensers that integrate with location tracking
 * to offer contextual drink menus
 */

export interface Beverage {
  id: string;
  name: string;
  category: 'cocktail' | 'beer' | 'wine' | 'spirit' | 'soft-drink' | 'coffee' | 'water';
  icon: string;
  ingredients: string[];
  abv?: number; // Alcohol by volume percentage
  temperature?: 'cold' | 'hot' | 'ambient';
  preparationTime: number; // seconds
  available: boolean;
  inventoryLevel: number; // percentage 0-100
}

export interface DispenserDevice {
  id: string;
  name: string;
  location: string; // Zone where dispenser is located
  type: 'cocktail-maker' | 'beer-tap' | 'wine-dispenser' | 'coffee-machine' | 'soda-fountain';
  beverages: Beverage[];
  status: 'online' | 'offline' | 'maintenance';
  lastMaintenance: Date;
}

export interface DrinkOrder {
  orderId: string;
  guestMac: string;
  guestName?: string;
  beverage: Beverage;
  dispenserId: string;
  zone: string;
  status: 'pending' | 'preparing' | 'ready' | 'delivered' | 'cancelled';
  orderedAt: Date;
  readyAt?: Date;
  deliveryLocation?: string;
}

export interface DispenserStats {
  dispenserId: string;
  totalDrinks: number;
  popularDrinks: { name: string; count: number }[];
  averagePreparationTime: number;
  inventoryAlerts: { beverage: string; level: number }[];
}
