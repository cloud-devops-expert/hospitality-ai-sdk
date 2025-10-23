/**
 * Tenants Collection
 *
 * Exempt from tenant isolation (admin-only access)
 */

import type { CollectionConfig } from 'payload/types';

export const Tenants: CollectionConfig = {
  slug: 'tenants',

  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'status', 'plan'],
    group: 'Administration',
  },

  access: {
    // Only admins can manage tenants
    read: ({ req: { user } }) => {
      return user?.role === 'admin';
    },
    create: ({ req: { user } }) => {
      return user?.role === 'admin';
    },
    update: ({ req: { user } }) => {
      return user?.role === 'admin';
    },
    delete: ({ req: { user } }) => {
      return user?.role === 'admin';
    },
  },

  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      label: 'Tenant Name',
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      options: [
        { label: 'Active', value: 'active' },
        { label: 'Suspended', value: 'suspended' },
        { label: 'Cancelled', value: 'cancelled' },
      ],
      defaultValue: 'active',
    },
    {
      name: 'plan',
      type: 'select',
      options: [
        { label: 'Free', value: 'free' },
        { label: 'Pro', value: 'pro' },
        { label: 'Enterprise', value: 'enterprise' },
      ],
      defaultValue: 'free',
    },
  ],

  timestamps: true,
};
