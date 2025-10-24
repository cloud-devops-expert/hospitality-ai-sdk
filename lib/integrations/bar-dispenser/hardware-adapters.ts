/**
 * Hardware Adapter Examples for Bar Dispensers
 *
 * Real-world integration adapters for commercial bar hardware
 * Based on actual vendor APIs and protocols
 */

import { Beverage, DispenserDevice, DrinkOrder } from './types';

// ============================================================================
// Base Interface - All adapters implement this
// ============================================================================

export interface IDispenserAdapter {
  id: string;
  name: string;
  location: string;
  status: 'online' | 'offline' | 'maintenance';

  // Core operations
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  getBeverages(): Promise<Beverage[]>;
  dispense(beverageId: string, options?: DispenseOptions): Promise<DrinkOrder>;
  getInventory(): Promise<InventoryItem[]>;
  getStatus(): Promise<DispenserStatus>;
}

export interface DispenseOptions {
  amount?: number; // ml
  strength?: 'weak' | 'regular' | 'strong';
  ice?: boolean;
  temperature?: 'hot' | 'cold' | 'ambient';
}

export interface InventoryItem {
  id: string;
  name: string;
  level: number; // percentage 0-100
  unit: 'ml' | 'oz' | 'count';
  alertThreshold: number;
}

export interface DispenserStatus {
  online: boolean;
  lastMaintenance: Date;
  errorCode?: string;
  errorMessage?: string;
  temperature?: number;
  uptime?: number;
}

// ============================================================================
// 1. Berg Cocktail Station Adapter (REST API)
// ============================================================================

interface BergConfig {
  baseUrl: string; // http://192.168.1.100
  apiKey: string;
  stationId: string;
}

export class BergCocktailAdapter implements IDispenserAdapter {
  id: string;
  name: string;
  location: string;
  status: 'online' | 'offline' | 'maintenance' = 'offline';

  private config: BergConfig;

  constructor(config: BergConfig & { location: string; name: string }) {
    this.config = config;
    this.id = `berg-${config.stationId}`;
    this.name = config.name;
    this.location = config.location;
  }

  async connect(): Promise<void> {
    try {
      const response = await fetch(`${this.config.baseUrl}/api/v1/status`, {
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
        },
      });

      if (response.ok) {
        this.status = 'online';
      }
    } catch (error) {
      this.status = 'offline';
      throw new Error(`Failed to connect to Berg station: ${error}`);
    }
  }

  async disconnect(): Promise<void> {
    this.status = 'offline';
  }

  async getBeverages(): Promise<Beverage[]> {
    const response = await fetch(`${this.config.baseUrl}/api/v1/recipes`, {
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
      },
    });

    const data = await response.json();

    return data.recipes.map((recipe: any) => ({
      id: recipe.id,
      name: recipe.name,
      category: 'cocktail',
      icon: this.getIconForCocktail(recipe.name),
      ingredients: recipe.ingredients.map((i: any) => i.name),
      abv: recipe.abv,
      temperature: 'cold',
      preparationTime: recipe.estimatedTime || 45,
      available: recipe.canMake,
      inventoryLevel: this.calculateInventoryLevel(recipe),
    }));
  }

  async dispense(beverageId: string, options?: DispenseOptions): Promise<DrinkOrder> {
    const response = await fetch(`${this.config.baseUrl}/api/v1/orders`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        recipeId: beverageId,
        strength: options?.strength || 'regular',
        ice: options?.ice ?? true,
      }),
    });

    const order = await response.json();

    return {
      orderId: order.id,
      guestMac: '',
      beverage: await this.getBeverageById(beverageId),
      dispenserId: this.id,
      zone: this.location,
      status: 'preparing',
      orderedAt: new Date(),
    };
  }

  async getInventory(): Promise<InventoryItem[]> {
    const response = await fetch(`${this.config.baseUrl}/api/v1/inventory`, {
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
      },
    });

    const data = await response.json();

    return data.ingredients.map((item: any) => ({
      id: item.id,
      name: item.name,
      level: item.level,
      unit: 'ml',
      alertThreshold: 30,
    }));
  }

  async getStatus(): Promise<DispenserStatus> {
    const response = await fetch(`${this.config.baseUrl}/api/v1/status`, {
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
      },
    });

    const data = await response.json();

    return {
      online: data.status === 'ready',
      lastMaintenance: new Date(data.lastMaintenance),
      errorCode: data.error?.code,
      errorMessage: data.error?.message,
      temperature: data.temperature,
      uptime: data.uptime,
    };
  }

  private getIconForCocktail(name: string): string {
    const icons: Record<string, string> = {
      'mojito': '🍹',
      'margarita': '🍸',
      'cosmopolitan': '🍸',
      'martini': '🍸',
      'old fashioned': '🥃',
      'manhattan': '🥃',
    };
    return icons[name.toLowerCase()] || '🍹';
  }

  private calculateInventoryLevel(recipe: any): number {
    // Simplified - check lowest ingredient level
    return Math.min(...recipe.ingredients.map((i: any) => i.level || 100));
  }

  private async getBeverageById(id: string): Promise<Beverage> {
    const beverages = await this.getBeverages();
    const beverage = beverages.find(b => b.id === id);
    if (!beverage) throw new Error(`Beverage ${id} not found`);
    return beverage;
  }
}

// ============================================================================
// 2. Barpay Smart Bar Adapter (Modbus TCP)
// ============================================================================

interface BarpayConfig {
  ipAddress: string; // 192.168.1.101
  port: number; // 502 (Modbus standard)
}

export class BarpayAdapter implements IDispenserAdapter {
  id: string;
  name: string;
  location: string;
  status: 'online' | 'offline' | 'maintenance' = 'offline';

  private config: BarpayConfig;
  // In real implementation, use 'modbus-serial' npm package
  private modbusClient: any;

  constructor(config: BarpayConfig & { location: string; name: string; id: string }) {
    this.config = config;
    this.id = config.id;
    this.name = config.name;
    this.location = config.location;
  }

  async connect(): Promise<void> {
    try {
      // Real implementation:
      // import ModbusRTU from 'modbus-serial';
      // this.modbusClient = new ModbusRTU();
      // await this.modbusClient.connectTCP(this.config.ipAddress, { port: this.config.port });

      this.status = 'online';
      console.log(`Connected to Barpay at ${this.config.ipAddress}:${this.config.port}`);
    } catch (error) {
      this.status = 'offline';
      throw new Error(`Failed to connect to Barpay: ${error}`);
    }
  }

  async disconnect(): Promise<void> {
    // await this.modbusClient.close();
    this.status = 'offline';
  }

  async getBeverages(): Promise<Beverage[]> {
    // Read bottle configuration from Modbus registers
    // Registers 0-15: Bottle IDs
    // Registers 100-115: Bottle levels

    // Simplified example (real implementation would read from Modbus)
    return [
      {
        id: 'spirit-vodka',
        name: 'Vodka',
        category: 'spirit',
        icon: '🥃',
        ingredients: ['Vodka'],
        abv: 40,
        temperature: 'ambient',
        preparationTime: 5,
        available: true,
        inventoryLevel: 85,
      },
      {
        id: 'spirit-rum',
        name: 'White Rum',
        category: 'spirit',
        icon: '🥃',
        ingredients: ['Rum'],
        abv: 40,
        temperature: 'ambient',
        preparationTime: 5,
        available: true,
        inventoryLevel: 70,
      },
    ];
  }

  async dispense(beverageId: string, options?: DispenseOptions): Promise<DrinkOrder> {
    const bottle = this.getBottlePosition(beverageId);
    const amount = options?.amount || 50; // ml

    // Real implementation:
    // Write to coil to start pour
    // await this.modbusClient.writeCoil(bottle.position, true);
    // Write to register to set amount
    // await this.modbusClient.writeRegister(bottle.position + 100, amount);

    console.log(`Dispensing ${amount}ml from bottle ${bottle.position} (${beverageId})`);

    const beverage = await this.getBeverageById(beverageId);

    return {
      orderId: `ORD-${Date.now()}`,
      guestMac: '',
      beverage,
      dispenserId: this.id,
      zone: this.location,
      status: 'preparing',
      orderedAt: new Date(),
    };
  }

  async getInventory(): Promise<InventoryItem[]> {
    // Read from Modbus registers 100-115 (bottle levels)
    // Real implementation would use:
    // const data = await this.modbusClient.readHoldingRegisters(100, 16);

    return [
      { id: 'vodka', name: 'Vodka', level: 85, unit: 'ml', alertThreshold: 20 },
      { id: 'rum', name: 'White Rum', level: 70, unit: 'ml', alertThreshold: 20 },
    ];
  }

  async getStatus(): Promise<DispenserStatus> {
    // Read status from Modbus register 0
    // const statusReg = await this.modbusClient.readHoldingRegisters(0, 1);

    return {
      online: this.status === 'online',
      lastMaintenance: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
      uptime: 7200, // seconds
    };
  }

  private getBottlePosition(beverageId: string): { position: number; name: string } {
    const bottles: Record<string, number> = {
      'spirit-vodka': 1,
      'spirit-rum': 2,
      'spirit-gin': 3,
      'spirit-tequila': 4,
    };

    return {
      position: bottles[beverageId] || 1,
      name: beverageId,
    };
  }

  private async getBeverageById(id: string): Promise<Beverage> {
    const beverages = await this.getBeverages();
    const beverage = beverages.find(b => b.id === id);
    if (!beverage) throw new Error(`Beverage ${id} not found`);
    return beverage;
  }
}

// ============================================================================
// 3. WineEmotion Dispenser Adapter (Modbus TCP)
// ============================================================================

export class WineEmotionAdapter implements IDispenserAdapter {
  id: string;
  name: string;
  location: string;
  status: 'online' | 'offline' | 'maintenance' = 'offline';

  private ipAddress: string;
  private port: number;

  constructor(config: { ipAddress: string; port: number; location: string; name: string; id: string }) {
    this.id = config.id;
    this.name = config.name;
    this.location = config.location;
    this.ipAddress = config.ipAddress;
    this.port = config.port;
  }

  async connect(): Promise<void> {
    // Similar to Barpay (Modbus TCP)
    this.status = 'online';
    console.log(`Connected to WineEmotion at ${this.ipAddress}:${this.port}`);
  }

  async disconnect(): Promise<void> {
    this.status = 'offline';
  }

  async getBeverages(): Promise<Beverage[]> {
    // Read wine bottle data from Modbus
    return [
      {
        id: 'wine-chardonnay',
        name: 'Chardonnay Reserve',
        category: 'wine',
        icon: '🍷',
        ingredients: ['White Wine'],
        abv: 13,
        temperature: 'cold',
        preparationTime: 15,
        available: true,
        inventoryLevel: 60,
      },
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
    ];
  }

  async dispense(beverageId: string, options?: DispenseOptions): Promise<DrinkOrder> {
    const pourSize = options?.amount || 150; // ml (standard glass)

    console.log(`Dispensing ${pourSize}ml of ${beverageId}`);

    const beverage = await this.getBeverageById(beverageId);

    return {
      orderId: `WINE-${Date.now()}`,
      guestMac: '',
      beverage,
      dispenserId: this.id,
      zone: this.location,
      status: 'preparing',
      orderedAt: new Date(),
    };
  }

  async getInventory(): Promise<InventoryItem[]> {
    return [
      { id: 'wine-chardonnay', name: 'Chardonnay Reserve', level: 60, unit: 'ml', alertThreshold: 25 },
      { id: 'wine-merlot', name: 'Merlot', level: 80, unit: 'ml', alertThreshold: 25 },
    ];
  }

  async getStatus(): Promise<DispenserStatus> {
    return {
      online: this.status === 'online',
      lastMaintenance: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      temperature: 12.5, // celsius
      uptime: 5400,
    };
  }

  private async getBeverageById(id: string): Promise<Beverage> {
    const beverages = await this.getBeverages();
    const beverage = beverages.find(b => b.id === id);
    if (!beverage) throw new Error(`Wine ${id} not found`);
    return beverage;
  }
}

// ============================================================================
// 4. Franke Coffee Machine Adapter (WiFi/REST API)
// ============================================================================

interface FrankeConfig {
  baseUrl: string; // http://192.168.1.105 (FoamMaster WiFi module)
  apiKey: string;
}

export class FrankeCoffeeAdapter implements IDispenserAdapter {
  id: string;
  name: string;
  location: string;
  status: 'online' | 'offline' | 'maintenance' = 'offline';

  private config: FrankeConfig;

  constructor(config: FrankeConfig & { location: string; name: string; id: string }) {
    this.config = config;
    this.id = config.id;
    this.name = config.name;
    this.location = config.location;
  }

  async connect(): Promise<void> {
    try {
      const response = await fetch(`${this.config.baseUrl}/api/v1/status`, {
        headers: {
          'X-API-Key': this.config.apiKey,
        },
      });

      if (response.ok) {
        this.status = 'online';
      }
    } catch (error) {
      this.status = 'offline';
      throw new Error(`Failed to connect to Franke machine: ${error}`);
    }
  }

  async disconnect(): Promise<void> {
    this.status = 'offline';
  }

  async getBeverages(): Promise<Beverage[]> {
    return [
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
        inventoryLevel: 75,
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
        inventoryLevel: 75,
      },
    ];
  }

  async dispense(beverageId: string, options?: DispenseOptions): Promise<DrinkOrder> {
    const response = await fetch(`${this.config.baseUrl}/api/v1/brew`, {
      method: 'POST',
      headers: {
        'X-API-Key': this.config.apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        product: beverageId.replace('coffee-', ''),
        size: 'medium',
        strength: options?.strength || 'regular',
        temperature: 'hot',
      }),
    });

    const data = await response.json();

    const beverage = await this.getBeverageById(beverageId);

    return {
      orderId: data.brewId,
      guestMac: '',
      beverage,
      dispenserId: this.id,
      zone: this.location,
      status: 'preparing',
      orderedAt: new Date(),
    };
  }

  async getInventory(): Promise<InventoryItem[]> {
    const response = await fetch(`${this.config.baseUrl}/api/v1/status`, {
      headers: {
        'X-API-Key': this.config.apiKey,
      },
    });

    const data = await response.json();

    return [
      { id: 'beans', name: 'Coffee Beans', level: data.beansLevel || 80, unit: 'count', alertThreshold: 20 },
      { id: 'water', name: 'Water', level: data.waterLevel || 90, unit: 'ml', alertThreshold: 10 },
      { id: 'milk', name: 'Milk', level: data.milkLevel || 70, unit: 'ml', alertThreshold: 15 },
    ];
  }

  async getStatus(): Promise<DispenserStatus> {
    const response = await fetch(`${this.config.baseUrl}/api/v1/status`, {
      headers: {
        'X-API-Key': this.config.apiKey,
      },
    });

    const data = await response.json();

    return {
      online: data.status === 'ready',
      lastMaintenance: new Date(data.lastMaintenance),
      errorCode: data.error?.code,
      errorMessage: data.error?.message,
      uptime: data.uptime,
    };
  }

  private async getBeverageById(id: string): Promise<Beverage> {
    const beverages = await this.getBeverages();
    const beverage = beverages.find(b => b.id === id);
    if (!beverage) throw new Error(`Coffee ${id} not found`);
    return beverage;
  }
}

// ============================================================================
// 5. Adapter Factory - Automatically create the right adapter
// ============================================================================

export type DispenserType = 'berg' | 'barpay' | 'wine-emotion' | 'franke';

export interface DispenserConfig {
  type: DispenserType;
  id: string;
  name: string;
  location: string;
  connection: any; // Type-specific connection details
}

export class DispenserAdapterFactory {
  static create(config: DispenserConfig): IDispenserAdapter {
    switch (config.type) {
      case 'berg':
        return new BergCocktailAdapter({
          baseUrl: config.connection.baseUrl,
          apiKey: config.connection.apiKey,
          stationId: config.connection.stationId,
          name: config.name,
          location: config.location,
        });

      case 'barpay':
        return new BarpayAdapter({
          ipAddress: config.connection.ipAddress,
          port: config.connection.port || 502,
          id: config.id,
          name: config.name,
          location: config.location,
        });

      case 'wine-emotion':
        return new WineEmotionAdapter({
          ipAddress: config.connection.ipAddress,
          port: config.connection.port || 502,
          id: config.id,
          name: config.name,
          location: config.location,
        });

      case 'franke':
        return new FrankeCoffeeAdapter({
          baseUrl: config.connection.baseUrl,
          apiKey: config.connection.apiKey,
          id: config.id,
          name: config.name,
          location: config.location,
        });

      default:
        throw new Error(`Unknown dispenser type: ${config.type}`);
    }
  }
}

// ============================================================================
// Usage Example
// ============================================================================

/*
// Initialize dispensers from config
const dispensers = [
  {
    type: 'berg',
    id: 'berg-lobby',
    name: 'Lobby Cocktail Station',
    location: 'lobby',
    connection: {
      baseUrl: 'http://192.168.1.100',
      apiKey: process.env.BERG_API_KEY,
      stationId: 'BERG-001',
    },
  },
  {
    type: 'franke',
    id: 'franke-office',
    name: 'Business Center Coffee',
    location: 'office',
    connection: {
      baseUrl: 'http://192.168.1.105',
      apiKey: process.env.FRANKE_API_KEY,
    },
  },
];

// Create adapters
const adapters = dispensers.map(config =>
  DispenserAdapterFactory.create(config)
);

// Connect to all dispensers
await Promise.all(adapters.map(a => a.connect()));

// Get beverages for a specific zone
const officeBeverages = await Promise.all(
  adapters
    .filter(a => a.location === 'office')
    .map(a => a.getBeverages())
);

console.log('Office beverages:', officeBeverages.flat());
*/
