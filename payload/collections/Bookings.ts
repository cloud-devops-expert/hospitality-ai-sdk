/**
 * Bookings Collection with RLS
 *
 * ✅ All database operations automatically tracked via instrumented client
 * ✅ Tenant isolation enforced via RLS
 * ✅ Zero manual instrumentation needed
 */

import type { CollectionConfig } from 'payload/types';
import { getInstrumentedClient } from '@/lib/database/instrumented-rds-client';

export const Bookings: CollectionConfig = {
  slug: 'bookings',

  // Admin configuration
  admin: {
    useAsTitle: 'guestName',
    defaultColumns: ['guestName', 'checkIn', 'checkOut', 'status', 'totalAmount'],
    group: 'Operations',
  },

  // Access control
  access: {
    // Read: Users can only see bookings from their tenant
    read: async ({ req }) => {
      // Tenant context automatically injected by plugin
      if (!req.context?.tenantId) {
        return false;
      }

      // Additional custom logic (optional)
      // RLS already enforces tenant isolation
      return true;
    },

    // Create: Users can only create bookings for their tenant
    create: async ({ req }) => {
      if (!req.user) {
        return false;
      }

      // Tenant will be automatically injected
      return true;
    },

    // Update: Users can only update their tenant's bookings
    update: async ({ req }) => {
      if (!req.user || !req.context?.tenantId) {
        return false;
      }

      // RLS ensures users can only update their tenant's data
      return true;
    },

    // Delete: Users can only delete their tenant's bookings
    delete: async ({ req }) => {
      if (!req.user || !req.context?.tenantId) {
        return false;
      }

      return true;
    },
  },

  // Hooks
  hooks: {
    // Before create: validate and set defaults
    beforeChange: [
      async ({ data, req, operation }) => {
        if (operation === 'create') {
          // Tenant ID automatically injected by plugin
          // Set created_by
          if (req.user?.id) {
            data.created_by = req.user.id;
          }

          // Set default status
          if (!data.status) {
            data.status = 'pending';
          }

          // Calculate total amount if not provided
          if (!data.total_amount && data.nightly_rate && data.nights) {
            data.total_amount = data.nightly_rate * data.nights;
          }
        }

        return data;
      },
    ],

    // After read: custom business logic (optional)
    afterRead: [
      async ({ doc, req }) => {
        // Add computed fields or transform data
        return doc;
      },
    ],

    // After change: trigger events
    afterChange: [
      async ({ doc, req, operation }) => {
        // ✅ All operations automatically tracked!

        // Trigger notifications, webhooks, etc.
        if (operation === 'create') {
          console.log(`New booking created: ${doc.id} for tenant ${req.context?.tenantId}`);
          // Send confirmation email, etc.
        }

        return doc;
      },
    ],
  },

  // Fields
  fields: [
    {
      name: 'tenant_id',
      type: 'text',
      required: true,
      admin: {
        readOnly: true,
        hidden: true, // Automatically set by plugin
      },
    },
    {
      name: 'guestName',
      type: 'text',
      required: true,
      label: 'Guest Name',
    },
    {
      name: 'guestEmail',
      type: 'email',
      required: true,
      label: 'Guest Email',
    },
    {
      name: 'guestPhone',
      type: 'text',
      label: 'Guest Phone',
    },
    {
      name: 'property',
      type: 'relationship',
      relationTo: 'properties',
      required: true,
      label: 'Property',
    },
    {
      name: 'checkIn',
      type: 'date',
      required: true,
      label: 'Check-In Date',
      admin: {
        date: {
          pickerAppearance: 'dayOnly',
        },
      },
    },
    {
      name: 'checkOut',
      type: 'date',
      required: true,
      label: 'Check-Out Date',
      admin: {
        date: {
          pickerAppearance: 'dayOnly',
        },
      },
    },
    {
      name: 'nights',
      type: 'number',
      required: true,
      label: 'Number of Nights',
      min: 1,
    },
    {
      name: 'guests',
      type: 'number',
      required: true,
      label: 'Number of Guests',
      min: 1,
      defaultValue: 1,
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      label: 'Booking Status',
      options: [
        {
          label: 'Pending',
          value: 'pending',
        },
        {
          label: 'Confirmed',
          value: 'confirmed',
        },
        {
          label: 'Checked In',
          value: 'checked_in',
        },
        {
          label: 'Checked Out',
          value: 'checked_out',
        },
        {
          label: 'Cancelled',
          value: 'cancelled',
        },
      ],
      defaultValue: 'pending',
    },
    {
      name: 'nightly_rate',
      type: 'number',
      required: true,
      label: 'Nightly Rate',
      min: 0,
    },
    {
      name: 'total_amount',
      type: 'number',
      required: true,
      label: 'Total Amount',
      min: 0,
    },
    {
      name: 'payment_status',
      type: 'select',
      label: 'Payment Status',
      options: [
        {
          label: 'Pending',
          value: 'pending',
        },
        {
          label: 'Paid',
          value: 'paid',
        },
        {
          label: 'Refunded',
          value: 'refunded',
        },
      ],
      defaultValue: 'pending',
    },
    {
      name: 'special_requests',
      type: 'textarea',
      label: 'Special Requests',
    },
    {
      name: 'created_by',
      type: 'text',
      label: 'Created By',
      admin: {
        readOnly: true,
        hidden: true,
      },
    },
  ],

  // Timestamps
  timestamps: true,

  // Versions (optional)
  versions: {
    drafts: false,
  },
};
