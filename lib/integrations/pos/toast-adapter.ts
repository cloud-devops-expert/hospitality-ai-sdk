/**
 * Toast POS Integration Adapter
 *
 * Toast is a popular restaurant POS system with a comprehensive REST API.
 * API Docs: https://doc.toasttab.com/
 *
 * ISV/SI Note: Only use if client already has Toast POS.
 */

export interface ToastConfig {
  apiToken: string; // Toast API token
  restaurantGuid: string; // Restaurant GUID
  managementGroupGuid?: string; // Multi-location management group
  baseUrl: string; // e.g., 'https://ws-api.toasttab.com'
}

export interface ToastCheck {
  guid: string;
  entityType: 'Check';
  checkNumber: number;
  openedDate: string;
  closedDate?: string;
  modifiedDate: string;
  deletedDate?: string;
  deleted: boolean;
  selections: ToastSelection[];
  customer?: {
    guid: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
  payments: ToastPayment[];
  totalAmount: number;
  taxAmount: number;
  tipAmount: number;
  discountAmount: number;
  dueAmount: number;
}

export interface ToastSelection {
  guid: string;
  itemId: string;
  name: string;
  preDiscountPrice: number;
  price: number;
  tax: number;
  quantity: number;
  modifiers: ToastModifier[];
}

export interface ToastModifier {
  guid: string;
  name: string;
  price: number;
}

export interface ToastPayment {
  guid: string;
  paidDate: string;
  amount: number;
  tipAmount: number;
  type: 'CASH' | 'CREDIT' | 'GIFT_CARD' | 'HOUSE_ACCOUNT' | 'OTHER';
  cardType?: string;
  last4Digits?: string;
}

export interface ToastMenuItem {
  guid: string;
  name: string;
  description: string;
  price: number;
  menuGroupGuid: string;
  visibility: 'VISIBLE' | 'HIDDEN' | 'POS_ONLY';
  inStock: boolean;
}

export class ToastPOSAdapter {
  private config: ToastConfig;

  constructor(config: ToastConfig) {
    this.config = config;
  }

  private async request(endpoint: string, method: string = 'GET', body?: any) {
    const response = await fetch(`${this.config.baseUrl}${endpoint}`, {
      method,
      headers: {
        'Authorization': `Bearer ${this.config.apiToken}`,
        'Content-Type': 'application/json',
        'Toast-Restaurant-External-ID': this.config.restaurantGuid,
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Toast API error: ${response.status} ${response.statusText} - ${error}`);
    }

    return response.json();
  }

  /**
   * Get checks (orders) for a date range
   */
  async getChecks(startDate: Date, endDate: Date): Promise<ToastCheck[]> {
    const params = new URLSearchParams({
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      pageSize: '100',
    });

    const data = await this.request(`/orders/v2/checks?${params}`);
    return data.data || [];
  }

  /**
   * Get a specific check by GUID
   */
  async getCheck(checkGuid: string): Promise<ToastCheck> {
    return this.request(`/orders/v2/checks/${checkGuid}`);
  }

  /**
   * Get menu items
   */
  async getMenuItems(): Promise<ToastMenuItem[]> {
    const data = await this.request(`/menus/v2/menus`);
    return data.data || [];
  }

  /**
   * Create a check (order)
   */
  async createCheck(
    customerId: string,
    items: { itemGuid: string; quantity: number; modifiers?: string[] }[],
    tableGuid?: string
  ): Promise<string> {
    const body = {
      entityType: 'Check',
      customer: customerId ? { guid: customerId } : undefined,
      table: tableGuid ? { guid: tableGuid } : undefined,
      selections: items.map((item) => ({
        itemGuid: item.itemGuid,
        quantity: item.quantity,
        modifiers: item.modifiers?.map((modGuid) => ({ modifierGuid: modGuid })) || [],
      })),
    };

    const data = await this.request('/orders/v2/checks', 'POST', body);
    return data.guid;
  }

  /**
   * Add payment to a check
   */
  async addPayment(
    checkGuid: string,
    amount: number,
    tipAmount: number = 0,
    type: 'CASH' | 'CREDIT' | 'HOUSE_ACCOUNT' = 'CREDIT',
    roomNumber?: string
  ): Promise<void> {
    const body = {
      entityType: 'Payment',
      amount,
      tipAmount,
      type,
      // For room charges, use HOUSE_ACCOUNT type
      houseAccountName: roomNumber ? `Room ${roomNumber}` : undefined,
    };

    await this.request(`/orders/v2/checks/${checkGuid}/payments`, 'POST', body);
  }

  /**
   * Get sales summary for a date range
   */
  async getSalesSummary(startDate: Date, endDate: Date): Promise<any> {
    const params = new URLSearchParams({
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    });

    return this.request(`/reports/v2/sales?${params}`);
  }

  /**
   * Webhook handler for Toast events
   * Toast can send webhooks for new orders, payments, etc.
   */
  async handleWebhook(event: any): Promise<void> {
    switch (event.eventType) {
      case 'ORDER_CREATED':
        console.log('New order:', event.guid);
        // Sync to PMS, send to kitchen, etc.
        break;

      case 'ORDER_MODIFIED':
        console.log('Order modified:', event.guid);
        break;

      case 'ORDER_PAID':
        console.log('Order paid:', event.guid);
        // Sync payment to accounting, send receipt, etc.
        break;

      case 'ORDER_CLOSED':
        console.log('Order closed:', event.guid);
        break;

      default:
        console.log('Unknown webhook event:', event.eventType);
    }
  }
}

/**
 * Example Usage
 */
export async function exampleToastIntegration() {
  const toast = new ToastPOSAdapter({
    apiToken: process.env.TOAST_API_TOKEN || '',
    restaurantGuid: process.env.TOAST_RESTAURANT_GUID || '',
    baseUrl: 'https://ws-api.toasttab.com',
  });

  // 1. Get today's checks (orders)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const endOfDay = new Date(today);
  endOfDay.setHours(23, 59, 59, 999);

  const checks = await toast.getChecks(today, endOfDay);
  console.log(`Found ${checks.length} checks for today`);

  // 2. Get menu items
  const menuItems = await toast.getMenuItems();
  console.log(`Menu has ${menuItems.length} items`);

  // 3. Create a new check (order)
  // const checkGuid = await toast.createCheck(
  //   'customer-guid',
  //   [
  //     { itemGuid: 'item-guid-1', quantity: 2 },
  //     { itemGuid: 'item-guid-2', quantity: 1 }
  //   ]
  // );

  // 4. Add payment (charge to room)
  // await toast.addPayment(checkGuid, 25.50, 5.00, 'HOUSE_ACCOUNT', '305');

  // 5. Get sales summary
  const salesSummary = await toast.getSalesSummary(today, endOfDay);
  console.log(`Sales summary:`, salesSummary);
}
