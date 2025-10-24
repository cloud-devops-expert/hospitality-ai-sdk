/**
 * Bar Dispenser Client
 *
 * Simulates smart beverage dispensers across the property
 * Integrates with UniFi location tracking to offer contextual drink menus
 */

import { Beverage, DispenserDevice, DrinkOrder } from './types';

export class BarDispenserClient {
  private dispensers: DispenserDevice[] = [];
  private orders: DrinkOrder[] = [];

  constructor() {
    this.initializeDispensers();
  }

  private initializeDispensers(): void {
    // Lobby Bar - Premium cocktails and spirits
    this.dispensers.push({
      id: 'lobby-bar-001',
      name: 'Lobby Premium Bar',
      location: 'lobby',
      type: 'cocktail-maker',
      status: 'online',
      lastMaintenance: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      beverages: [
        {
          id: 'cocktail-mojito',
          name: 'Mojito',
          category: 'cocktail',
          icon: '🍹',
          ingredients: ['White Rum', 'Mint', 'Lime', 'Soda Water', 'Sugar'],
          abv: 10,
          temperature: 'cold',
          preparationTime: 45,
          available: true,
          inventoryLevel: 85,
        },
        {
          id: 'cocktail-margarita',
          name: 'Margarita',
          category: 'cocktail',
          icon: '🍸',
          ingredients: ['Tequila', 'Triple Sec', 'Lime Juice', 'Salt'],
          abv: 15,
          temperature: 'cold',
          preparationTime: 40,
          available: true,
          inventoryLevel: 90,
        },
        {
          id: 'wine-chardonnay',
          name: 'Chardonnay',
          category: 'wine',
          icon: '🍷',
          ingredients: ['White Wine'],
          abv: 13,
          temperature: 'cold',
          preparationTime: 15,
          available: true,
          inventoryLevel: 70,
        },
      ],
    });

    // Restaurant - Wine and dining beverages
    this.dispensers.push({
      id: 'restaurant-bar-001',
      name: 'Restaurant Wine Dispenser',
      location: 'restaurant',
      type: 'wine-dispenser',
      status: 'online',
      lastMaintenance: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      beverages: [
        {
          id: 'wine-merlot',
          name: 'Merlot',
          category: 'wine',
          icon: '🍷',
          ingredients: ['Red Wine'],
          abv: 14,
          temperature: 'ambient',
          preparationTime: 15,
          available: true,
          inventoryLevel: 80,
        },
        {
          id: 'wine-pinot-noir',
          name: 'Pinot Noir',
          category: 'wine',
          icon: '🍷',
          ingredients: ['Red Wine'],
          abv: 13.5,
          temperature: 'ambient',
          preparationTime: 15,
          available: true,
          inventoryLevel: 65,
        },
        {
          id: 'beer-craft-ipa',
          name: 'Craft IPA',
          category: 'beer',
          icon: '🍺',
          ingredients: ['Beer'],
          abv: 6.5,
          temperature: 'cold',
          preparationTime: 20,
          available: true,
          inventoryLevel: 90,
        },
      ],
    });

    // Spa/Pool - Refreshing drinks and smoothies
    this.dispensers.push({
      id: 'pool-bar-001',
      name: 'Poolside Refreshments',
      location: 'spa',
      type: 'soda-fountain',
      status: 'online',
      lastMaintenance: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      beverages: [
        {
          id: 'cocktail-pina-colada',
          name: 'Piña Colada',
          category: 'cocktail',
          icon: '🥥',
          ingredients: ['Rum', 'Coconut Cream', 'Pineapple Juice'],
          abv: 8,
          temperature: 'cold',
          preparationTime: 50,
          available: true,
          inventoryLevel: 75,
        },
        {
          id: 'soft-drink-lemonade',
          name: 'Fresh Lemonade',
          category: 'soft-drink',
          icon: '🍋',
          ingredients: ['Lemon', 'Water', 'Sugar'],
          temperature: 'cold',
          preparationTime: 30,
          available: true,
          inventoryLevel: 95,
        },
        {
          id: 'water-sparkling',
          name: 'Sparkling Water',
          category: 'water',
          icon: '💧',
          ingredients: ['Carbonated Water'],
          temperature: 'cold',
          preparationTime: 10,
          available: true,
          inventoryLevel: 100,
        },
      ],
    });

    // Room Service - Coffee and beverages
    this.dispensers.push({
      id: 'room-coffee-001',
      name: 'In-Room Coffee Station',
      location: 'room',
      type: 'coffee-machine',
      status: 'online',
      lastMaintenance: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      beverages: [
        {
          id: 'coffee-espresso',
          name: 'Espresso',
          category: 'coffee',
          icon: '☕',
          ingredients: ['Coffee Beans', 'Water'],
          temperature: 'hot',
          preparationTime: 25,
          available: true,
          inventoryLevel: 80,
        },
        {
          id: 'coffee-cappuccino',
          name: 'Cappuccino',
          category: 'coffee',
          icon: '☕',
          ingredients: ['Coffee Beans', 'Milk', 'Water'],
          temperature: 'hot',
          preparationTime: 35,
          available: true,
          inventoryLevel: 85,
        },
        {
          id: 'water-still',
          name: 'Still Water',
          category: 'water',
          icon: '💧',
          ingredients: ['Water'],
          temperature: 'cold',
          preparationTime: 5,
          available: true,
          inventoryLevel: 100,
        },
      ],
    });

    // Office - Coffee and energy drinks
    this.dispensers.push({
      id: 'office-coffee-001',
      name: 'Business Center Coffee Bar',
      location: 'office',
      type: 'coffee-machine',
      status: 'online',
      lastMaintenance: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      beverages: [
        {
          id: 'coffee-americano',
          name: 'Americano',
          category: 'coffee',
          icon: '☕',
          ingredients: ['Coffee Beans', 'Water'],
          temperature: 'hot',
          preparationTime: 20,
          available: true,
          inventoryLevel: 90,
        },
        {
          id: 'coffee-latte',
          name: 'Latte',
          category: 'coffee',
          icon: '☕',
          ingredients: ['Coffee Beans', 'Milk', 'Water'],
          temperature: 'hot',
          preparationTime: 30,
          available: true,
          inventoryLevel: 85,
        },
        {
          id: 'soft-drink-energy',
          name: 'Energy Drink',
          category: 'soft-drink',
          icon: '⚡',
          ingredients: ['Energy Drink'],
          temperature: 'cold',
          preparationTime: 10,
          available: true,
          inventoryLevel: 70,
        },
      ],
    });
  }

  /**
   * Get dispensers available in a specific zone
   */
  getDispensersByZone(zone: string): DispenserDevice[] {
    return this.dispensers.filter(d => d.location === zone && d.status === 'online');
  }

  /**
   * Get all available beverages for a zone
   */
  getBeveragesByZone(zone: string): Beverage[] {
    const dispensers = this.getDispensersByZone(zone);
    return dispensers.flatMap(d => d.beverages.filter(b => b.available));
  }

  /**
   * Order a drink
   */
  async orderDrink(
    guestMac: string,
    beverageId: string,
    zone: string,
    guestName?: string
  ): Promise<DrinkOrder> {
    const dispensers = this.getDispensersByZone(zone);

    for (const dispenser of dispensers) {
      const beverage = dispenser.beverages.find(b => b.id === beverageId);

      if (beverage && beverage.available) {
        const order: DrinkOrder = {
          orderId: `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          guestMac,
          guestName,
          beverage,
          dispenserId: dispenser.id,
          zone,
          status: 'pending',
          orderedAt: new Date(),
        };

        this.orders.push(order);

        // Simulate preparation
        setTimeout(() => {
          order.status = 'preparing';
        }, 1000);

        setTimeout(() => {
          order.status = 'ready';
          order.readyAt = new Date();
        }, beverage.preparationTime * 1000);

        return order;
      }
    }

    throw new Error(`Beverage ${beverageId} not available in ${zone}`);
  }

  /**
   * Get order status
   */
  getOrder(orderId: string): DrinkOrder | undefined {
    return this.orders.find(o => o.orderId === orderId);
  }

  /**
   * Get guest's order history
   */
  getGuestOrders(guestMac: string): DrinkOrder[] {
    return this.orders.filter(o => o.guestMac === guestMac);
  }

  /**
   * Get popular drinks by zone
   */
  getPopularDrinks(zone: string, limit: number = 3): Beverage[] {
    const zoneOrders = this.orders.filter(o => o.zone === zone);
    const drinkCounts = new Map<string, { beverage: Beverage; count: number }>();

    zoneOrders.forEach(order => {
      const existing = drinkCounts.get(order.beverage.id);
      if (existing) {
        existing.count++;
      } else {
        drinkCounts.set(order.beverage.id, { beverage: order.beverage, count: 1 });
      }
    });

    return Array.from(drinkCounts.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, limit)
      .map(item => item.beverage);
  }

  /**
   * Get all dispensers
   */
  getAllDispensers(): DispenserDevice[] {
    return this.dispensers;
  }

  /**
   * Check inventory levels
   */
  getLowInventoryAlerts(threshold: number = 30): { dispenser: string; beverage: string; level: number }[] {
    const alerts: { dispenser: string; beverage: string; level: number }[] = [];

    this.dispensers.forEach(dispenser => {
      dispenser.beverages.forEach(beverage => {
        if (beverage.inventoryLevel < threshold) {
          alerts.push({
            dispenser: dispenser.name,
            beverage: beverage.name,
            level: beverage.inventoryLevel,
          });
        }
      });
    });

    return alerts;
  }
}
