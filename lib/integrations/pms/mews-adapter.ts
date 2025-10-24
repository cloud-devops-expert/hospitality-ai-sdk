/**
 * Mews PMS Integration Adapter
 *
 * Mews is a modern cloud PMS with excellent API documentation.
 * API Docs: https://mews-systems.gitbook.io/connector-api/
 *
 * ISV/SI Note: Only use if client already has Mews PMS.
 */

export interface MewsConfig {
  clientToken: string; // OAuth client token
  accessToken: string; // OAuth access token
  platformAddress: string; // e.g., 'https://api.mews.com'
  enterpriseId: string; // Property ID
}

export interface MewsReservation {
  id: string;
  state: 'Confirmed' | 'Started' | 'Processed' | 'Canceled' | 'Optional';
  customerId: string;
  roomId: string;
  startUtc: string;
  endUtc: string;
  adultCount: number;
  childCount: number;
  totalAmount: {
    currency: string;
    netValue: number;
    grossValue: number;
  };
}

export interface MewsCustomer {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  nationalityCode: string;
  loyaltyCode?: string;
}

export interface MewsProduct {
  id: string;
  serviceId: string;
  name: string;
  externalName: string;
  price: {
    currency: string;
    netValue: number;
    grossValue: number;
  };
}

export class MewsPMSAdapter {
  private config: MewsConfig;

  constructor(config: MewsConfig) {
    this.config = config;
  }

  /**
   * Get all reservations for a date range
   */
  async getReservations(startDate: Date, endDate: Date): Promise<MewsReservation[]> {
    const response = await fetch(`${this.config.platformAddress}/api/connector/v1/reservations/getAll`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'ClientToken': this.config.clientToken,
        'AccessToken': this.config.accessToken,
      },
      body: JSON.stringify({
        ClientToken: this.config.clientToken,
        AccessToken: this.config.accessToken,
        Client: 'Hospitality Middleware',
        EnterpriseIds: [this.config.enterpriseId],
        ReservationIds: null, // Get all
        StartUtc: startDate.toISOString(),
        EndUtc: endDate.toISOString(),
        States: ['Confirmed', 'Started', 'Processed'],
        Extent: {
          Reservations: true,
          ReservationGroups: true,
          Customers: true,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Mews API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.Reservations || [];
  }

  /**
   * Get customer by ID
   */
  async getCustomer(customerId: string): Promise<MewsCustomer> {
    const response = await fetch(`${this.config.platformAddress}/api/connector/v1/customers/getAll`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'ClientToken': this.config.clientToken,
        'AccessToken': this.config.accessToken,
      },
      body: JSON.stringify({
        ClientToken: this.config.clientToken,
        AccessToken: this.config.accessToken,
        Client: 'Hospitality Middleware',
        EnterpriseIds: [this.config.enterpriseId],
        CustomerIds: [customerId],
      }),
    });

    if (!response.ok) {
      throw new Error(`Mews API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.Customers?.[0];
  }

  /**
   * Add product order (e.g., bar charge to room)
   */
  async addProductOrder(
    customerId: string,
    productId: string,
    quantity: number,
    unitAmount: number,
    notes?: string
  ): Promise<string> {
    const response = await fetch(`${this.config.platformAddress}/api/connector/v1/orders/add`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'ClientToken': this.config.clientToken,
        'AccessToken': this.config.accessToken,
      },
      body: JSON.stringify({
        ClientToken: this.config.clientToken,
        AccessToken: this.config.accessToken,
        Client: 'Hospitality Middleware',
        EnterpriseId: this.config.enterpriseId,
        ServiceId: productId,
        CustomerId: customerId,
        Items: [
          {
            Name: notes || 'Bar Charge',
            UnitCount: quantity,
            UnitAmount: {
              Currency: 'USD',
              NetValue: unitAmount,
              TaxCodes: ['Standard'],
            },
          },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`Mews API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.Id;
  }

  /**
   * Get all products/services
   */
  async getProducts(): Promise<MewsProduct[]> {
    const response = await fetch(`${this.config.platformAddress}/api/connector/v1/services/getAll`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'ClientToken': this.config.clientToken,
        'AccessToken': this.config.accessToken,
      },
      body: JSON.stringify({
        ClientToken: this.config.clientToken,
        AccessToken: this.config.accessToken,
        Client: 'Hospitality Middleware',
        EnterpriseIds: [this.config.enterpriseId],
      }),
    });

    if (!response.ok) {
      throw new Error(`Mews API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.Services || [];
  }

  /**
   * Webhook handler for Mews events
   * Mews can send webhooks for check-ins, check-outs, new reservations, etc.
   */
  async handleWebhook(event: any): Promise<void> {
    switch (event.Type) {
      case 'Reservation.Created':
        console.log('New reservation:', event.Data.ReservationId);
        // Trigger workflow: prepare room, send welcome email, etc.
        break;

      case 'Reservation.Updated':
        console.log('Reservation updated:', event.Data.ReservationId);
        break;

      case 'Reservation.Started':
        console.log('Guest checked in:', event.Data.ReservationId);
        // Trigger workflow: track guest WiFi, enable room services, etc.
        break;

      case 'Reservation.Processed':
        console.log('Guest checked out:', event.Data.ReservationId);
        // Trigger workflow: final billing, cleanup, etc.
        break;

      default:
        console.log('Unknown webhook event:', event.Type);
    }
  }
}

/**
 * Example Usage
 */
export async function exampleMewsIntegration() {
  const mews = new MewsPMSAdapter({
    clientToken: process.env.MEWS_CLIENT_TOKEN || '',
    accessToken: process.env.MEWS_ACCESS_TOKEN || '',
    platformAddress: 'https://api.mews.com',
    enterpriseId: process.env.MEWS_ENTERPRISE_ID || '',
  });

  // 1. Get today's reservations
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const reservations = await mews.getReservations(today, tomorrow);
  console.log(`Found ${reservations.length} reservations for today`);

  // 2. Get customer details
  if (reservations.length > 0) {
    const customer = await mews.getCustomer(reservations[0].customerId);
    console.log(`Customer: ${customer.firstName} ${customer.lastName}`);
  }

  // 3. Add bar charge to room
  // await mews.addProductOrder(customerId, 'bar-service-id', 1, 15.50, 'Mojito');

  // 4. Get all products/services
  const products = await mews.getProducts();
  console.log(`Available products: ${products.length}`);
}
