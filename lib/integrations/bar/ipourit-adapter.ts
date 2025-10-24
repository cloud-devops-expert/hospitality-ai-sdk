/**
 * iPourIt Self-Pour Beer Wall Integration Adapter
 *
 * iPourIt is a self-serve beer tap system with RFID/NFC cards.
 * API Docs: https://developer.ipourit.com/docs (fictional - based on typical REST API patterns)
 *
 * ISV/SI Note: Only use if client already has iPourIt equipment installed.
 * This is CLIENT-DRIVEN integration, not hardware promotion.
 */

export interface IPourItConfig {
  apiKey: string; // iPourIt API key
  locationId: string; // Location/venue ID
  baseUrl: string; // e.g., 'https://api.ipourit.com/v1'
}

export interface IPourItTap {
  id: string;
  tapNumber: number;
  name: string; // e.g., "IPA", "Lager", "Cider"
  brewery: string;
  abv: number; // Alcohol by volume
  pricePerOunce: number;
  status: 'active' | 'offline' | 'empty' | 'cleaning';
  kegVolume: number; // Remaining volume in ounces
  lastPour: Date;
}

export interface IPourItPour {
  id: string;
  tapId: string;
  cardId: string; // RFID/NFC card ID
  customerId?: string; // If linked to customer account
  ounces: number;
  price: number;
  timestamp: Date;
  tapName: string;
}

export interface IPourItCard {
  id: string;
  cardNumber: string;
  customerId?: string;
  customerName?: string;
  email?: string;
  balance: number;
  status: 'active' | 'suspended' | 'closed';
  createdAt: Date;
}

export class IPourItAdapter {
  private config: IPourItConfig;

  constructor(config: IPourItConfig) {
    this.config = config;
  }

  private async request(endpoint: string, method: string = 'GET', body?: any) {
    const response = await fetch(`${this.config.baseUrl}${endpoint}`, {
      method,
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json',
        'X-Location-ID': this.config.locationId,
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`iPourIt API error: ${response.status} ${response.statusText} - ${error}`);
    }

    return response.json();
  }

  /**
   * Get all taps
   */
  async getTaps(): Promise<IPourItTap[]> {
    const data = await this.request('/taps');
    return data.taps || [];
  }

  /**
   * Get pours for a date range
   */
  async getPours(startDate: Date, endDate: Date): Promise<IPourItPour[]> {
    const params = new URLSearchParams({
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    });

    const data = await this.request(`/pours?${params}`);
    return data.pours || [];
  }

  /**
   * Get pours by card ID
   */
  async getPoursByCard(cardId: string, limit: number = 50): Promise<IPourItPour[]> {
    const data = await this.request(`/cards/${cardId}/pours?limit=${limit}`);
    return data.pours || [];
  }

  /**
   * Get card by ID or number
   */
  async getCard(cardIdOrNumber: string): Promise<IPourItCard> {
    return this.request(`/cards/${cardIdOrNumber}`);
  }

  /**
   * Create or activate a card for a guest
   */
  async activateCard(
    cardNumber: string,
    customerId?: string,
    customerName?: string,
    email?: string,
    initialBalance?: number
  ): Promise<IPourItCard> {
    return this.request('/cards', 'POST', {
      cardNumber,
      customerId,
      customerName,
      email,
      balance: initialBalance || 0,
      status: 'active',
    });
  }

  /**
   * Add balance to a card (for prepaid model)
   */
  async addBalance(cardId: string, amount: number): Promise<IPourItCard> {
    return this.request(`/cards/${cardId}/balance`, 'POST', {
      amount,
    });
  }

  /**
   * Close a card (when guest checks out)
   */
  async closeCard(cardId: string): Promise<void> {
    await this.request(`/cards/${cardId}/close`, 'POST');
  }

  /**
   * Get total charges for a card (for room billing)
   */
  async getCardTotal(cardId: string): Promise<number> {
    const pours = await this.getPoursByCard(cardId);
    return pours.reduce((total, pour) => total + pour.price, 0);
  }

  /**
   * Webhook handler for iPourIt events
   * iPourIt sends real-time pour events via webhooks
   */
  async handleWebhook(event: any): Promise<void> {
    switch (event.type) {
      case 'pour.completed':
        console.log('Beer poured:', event.data);
        // Trigger: Charge to room, update inventory, analytics
        const pour = event.data as IPourItPour;
        console.log(`  Card: ${pour.cardId}, ${pour.ounces} oz, $${pour.price}`);
        break;

      case 'tap.empty':
        console.log('Keg empty:', event.data.tapId);
        // Trigger: Alert staff, order new keg, update menu
        break;

      case 'tap.offline':
        console.log('Tap offline:', event.data.tapId);
        // Trigger: Alert maintenance, update status
        break;

      case 'card.activated':
        console.log('Card activated:', event.data.cardId);
        break;

      default:
        console.log('Unknown webhook event:', event.type);
    }
  }

  /**
   * Charge room for all card pours (called at checkout)
   */
  async chargeRoomForCard(
    cardId: string,
    roomNumber: string,
    guestName: string
  ): Promise<{ total: number; pours: IPourItPour[] }> {
    const pours = await this.getPoursByCard(cardId);
    const total = pours.reduce((sum, pour) => sum + pour.price, 0);

    console.log(`Charging Room ${roomNumber} for ${guestName}:`);
    console.log(`  ${pours.length} pours`);
    console.log(`  Total: $${total.toFixed(2)}`);

    // In production: Call PMS API to add charge to room
    // await pmsAdapter.addProductOrder(customerId, 'bar-service-id', 1, total, 'Self-Pour Beer');

    return { total, pours };
  }
}

/**
 * Example Usage
 */
export async function exampleIPourItIntegration() {
  const ipourit = new IPourItAdapter({
    apiKey: process.env.IPOURIT_API_KEY || '',
    locationId: process.env.IPOURIT_LOCATION_ID || '',
    baseUrl: 'https://api.ipourit.com/v1',
  });

  // 1. Get all taps
  const taps = await ipourit.getTaps();
  console.log(`Found ${taps.length} taps:`);
  taps.forEach((tap) => {
    console.log(`  ${tap.tapNumber}. ${tap.name} (${tap.brewery}) - ${tap.status}`);
    console.log(`     $${tap.pricePerOunce}/oz, ${tap.kegVolume} oz remaining`);
  });

  // 2. Activate card for guest (check-in workflow)
  const card = await ipourit.activateCard(
    'CARD-12345',
    'guest-uuid',
    'John Doe',
    'john.doe@example.com'
  );
  console.log(`Card activated: ${card.id}, Balance: $${card.balance}`);

  // 3. Get today's pours
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const endOfDay = new Date(today);
  endOfDay.setHours(23, 59, 59, 999);

  const pours = await ipourit.getPours(today, endOfDay);
  console.log(`Today's pours: ${pours.length}`);
  console.log(`Total revenue: $${pours.reduce((sum, p) => sum + p.price, 0).toFixed(2)}`);

  // 4. Get card total (check-out workflow)
  const cardTotal = await ipourit.getCardTotal(card.id);
  console.log(`Card total charges: $${cardTotal.toFixed(2)}`);

  // 5. Charge room for card (at checkout)
  const { total, pours: cardPours } = await ipourit.chargeRoomForCard(
    card.id,
    '305',
    'John Doe'
  );
  console.log(`Charged $${total.toFixed(2)} to Room 305`);

  // 6. Close card
  await ipourit.closeCard(card.id);
  console.log('Card closed');
}
