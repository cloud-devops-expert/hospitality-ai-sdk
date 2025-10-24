/**
 * Stripe Payment Integration Adapter
 *
 * Stripe is the most popular payment gateway with excellent API documentation.
 * API Docs: https://stripe.com/docs/api
 *
 * ISV/SI Note: Only use if client already uses Stripe for payments.
 */

export interface StripeConfig {
  secretKey: string; // Stripe secret key (sk_test_... or sk_live_...)
  publishableKey?: string; // For frontend (pk_test_... or pk_live_...)
  webhookSecret?: string; // For webhook signature verification
}

export interface StripePaymentIntent {
  id: string;
  amount: number;
  currency: string;
  status: 'requires_payment_method' | 'requires_confirmation' | 'succeeded' | 'canceled';
  customer?: string;
  description?: string;
  metadata: Record<string, string>;
}

export interface StripeCustomer {
  id: string;
  email: string;
  name: string;
  phone?: string;
  metadata: Record<string, string>;
}

export class StripePaymentAdapter {
  private config: StripeConfig;
  private baseUrl = 'https://api.stripe.com/v1';

  constructor(config: StripeConfig) {
    this.config = config;
  }

  private async request(endpoint: string, method: string = 'GET', body?: any) {
    const headers: Record<string, string> = {
      'Authorization': `Bearer ${this.config.secretKey}`,
    };

    let requestBody: string | undefined;
    if (body) {
      if (method === 'POST' || method === 'PUT') {
        // Stripe API expects form-encoded data
        const params = new URLSearchParams();
        Object.entries(body).forEach(([key, value]) => {
          if (typeof value === 'object' && value !== null) {
            // Handle nested objects (e.g., metadata)
            Object.entries(value).forEach(([nestedKey, nestedValue]) => {
              params.append(`${key}[${nestedKey}]`, String(nestedValue));
            });
          } else {
            params.append(key, String(value));
          }
        });
        requestBody = params.toString();
        headers['Content-Type'] = 'application/x-www-form-urlencoded';
      }
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method,
      headers,
      body: requestBody,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Stripe API error: ${error.error?.message || response.statusText}`);
    }

    return response.json();
  }

  /**
   * Create a payment intent
   */
  async createPaymentIntent(
    amount: number,
    currency: string = 'usd',
    customerId?: string,
    description?: string,
    metadata?: Record<string, string>
  ): Promise<StripePaymentIntent> {
    return this.request('/payment_intents', 'POST', {
      amount: Math.round(amount * 100), // Stripe uses cents
      currency,
      customer: customerId,
      description,
      metadata,
      automatic_payment_methods: {
        enabled: true,
      },
    });
  }

  /**
   * Confirm a payment intent
   */
  async confirmPaymentIntent(paymentIntentId: string, paymentMethodId: string): Promise<StripePaymentIntent> {
    return this.request(`/payment_intents/${paymentIntentId}/confirm`, 'POST', {
      payment_method: paymentMethodId,
    });
  }

  /**
   * Create a customer
   */
  async createCustomer(
    email: string,
    name: string,
    phone?: string,
    metadata?: Record<string, string>
  ): Promise<StripeCustomer> {
    return this.request('/customers', 'POST', {
      email,
      name,
      phone,
      metadata,
    });
  }

  /**
   * Get customer by ID
   */
  async getCustomer(customerId: string): Promise<StripeCustomer> {
    return this.request(`/customers/${customerId}`);
  }

  /**
   * Charge a customer (immediate payment)
   */
  async chargeCustomer(
    customerId: string,
    amount: number,
    currency: string = 'usd',
    description?: string,
    metadata?: Record<string, string>
  ): Promise<any> {
    // First, create a payment intent
    const paymentIntent = await this.createPaymentIntent(amount, currency, customerId, description, metadata);

    // If customer has default payment method, charge it
    const customer = await this.getCustomer(customerId);
    if ((customer as any).default_source) {
      return this.confirmPaymentIntent(paymentIntent.id, (customer as any).default_source);
    }

    return paymentIntent;
  }

  /**
   * Refund a payment
   */
  async refund(paymentIntentId: string, amount?: number): Promise<any> {
    return this.request('/refunds', 'POST', {
      payment_intent: paymentIntentId,
      amount: amount ? Math.round(amount * 100) : undefined, // Partial refund if amount provided
    });
  }

  /**
   * Get payment intent
   */
  async getPaymentIntent(paymentIntentId: string): Promise<StripePaymentIntent> {
    return this.request(`/payment_intents/${paymentIntentId}`);
  }

  /**
   * List payments for a customer
   */
  async getCustomerPayments(customerId: string, limit: number = 10): Promise<StripePaymentIntent[]> {
    const data = await this.request(`/payment_intents?customer=${customerId}&limit=${limit}`);
    return data.data || [];
  }

  /**
   * Webhook handler for Stripe events
   * Stripe can send webhooks for successful payments, refunds, etc.
   */
  async handleWebhook(rawBody: string, signature: string): Promise<void> {
    // In production, verify signature:
    // const event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);

    const event = JSON.parse(rawBody);

    switch (event.type) {
      case 'payment_intent.succeeded':
        console.log('Payment succeeded:', event.data.object.id);
        // Update order status, send receipt, etc.
        break;

      case 'payment_intent.payment_failed':
        console.log('Payment failed:', event.data.object.id);
        // Notify customer, retry payment, etc.
        break;

      case 'charge.refunded':
        console.log('Charge refunded:', event.data.object.id);
        // Update accounting, notify customer, etc.
        break;

      case 'customer.created':
        console.log('Customer created:', event.data.object.id);
        break;

      default:
        console.log('Unknown webhook event:', event.type);
    }
  }

  /**
   * Create a charge to room (using Stripe for payment processing)
   */
  async chargeToRoom(
    roomNumber: string,
    guestEmail: string,
    guestName: string,
    amount: number,
    description: string
  ): Promise<string> {
    // 1. Find or create customer
    let customer: StripeCustomer;
    try {
      // In production, search for existing customer by email
      customer = await this.createCustomer(guestEmail, guestName, undefined, {
        roomNumber,
        propertyId: 'your-property-id',
      });
    } catch (error) {
      throw new Error(`Failed to create customer: ${error}`);
    }

    // 2. Create payment intent
    const paymentIntent = await this.createPaymentIntent(amount, 'usd', customer.id, description, {
      roomNumber,
      chargeType: 'room',
    });

    return paymentIntent.id;
  }
}

/**
 * Example Usage
 */
export async function exampleStripeIntegration() {
  const stripe = new StripePaymentAdapter({
    secretKey: process.env.STRIPE_SECRET_KEY || '',
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
  });

  // 1. Create a customer
  const customer = await stripe.createCustomer(
    'john.doe@example.com',
    'John Doe',
    '+1-555-123-4567',
    {
      roomNumber: '305',
      checkInDate: new Date().toISOString(),
    }
  );
  console.log(`Customer created: ${customer.id}`);

  // 2. Create a payment intent (e.g., for bar charge)
  const paymentIntent = await stripe.createPaymentIntent(
    25.50, // $25.50
    'usd',
    customer.id,
    'Bar Tab - Mojito and Chips',
    {
      roomNumber: '305',
      location: 'Pool Bar',
      orderId: 'order-123',
    }
  );
  console.log(`Payment intent created: ${paymentIntent.id}`);

  // 3. Charge to room (automatic if customer has default payment method)
  try {
    const chargeResult = await stripe.chargeToRoom(
      '305',
      'john.doe@example.com',
      'John Doe',
      25.50,
      'Bar Tab - Mojito and Chips'
    );
    console.log(`Charge created: ${chargeResult}`);
  } catch (error) {
    console.error('Charge failed:', error);
  }

  // 4. Get customer payments
  const payments = await stripe.getCustomerPayments(customer.id);
  console.log(`Customer has ${payments.length} payments`);

  // 5. Refund (if needed)
  // await stripe.refund(paymentIntent.id, 5.00); // Partial refund $5.00
}
