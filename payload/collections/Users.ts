/**
 * Users Collection
 *
 * Exempt from tenant isolation (users can belong to multiple tenants)
 */

import type { CollectionConfig } from 'payload/types';

export const Users: CollectionConfig = {
  slug: 'users',

  auth: {
    useAPIKey: true,
    tokenExpiration: 7200, // 2 hours
  },

  admin: {
    useAsTitle: 'email',
    defaultColumns: ['email', 'tenant_id', 'role', 'firstName', 'lastName'],
  },

  access: {
    // Admin users can see all users, regular users can only see themselves
    read: ({ req: { user } }) => {
      if (user?.role === 'admin') {
        return true;
      }

      return {
        id: {
          equals: user?.id,
        },
      };
    },

    create: ({ req: { user } }) => {
      return user?.role === 'admin';
    },

    update: ({ req: { user } }) => {
      if (user?.role === 'admin') {
        return true;
      }

      return {
        id: {
          equals: user?.id,
        },
      };
    },

    delete: ({ req: { user } }) => {
      return user?.role === 'admin';
    },
  },

  fields: [
    {
      name: 'tenant_id',
      type: 'text',
      required: true,
      label: 'Tenant ID',
      admin: {
        description: 'The tenant this user belongs to',
      },
    },
    {
      name: 'email',
      type: 'email',
      required: true,
      unique: true,
    },
    {
      name: 'firstName',
      type: 'text',
      label: 'First Name',
    },
    {
      name: 'lastName',
      type: 'text',
      label: 'Last Name',
    },
    {
      name: 'role',
      type: 'select',
      required: true,
      options: [
        {
          label: 'Admin',
          value: 'admin',
        },
        {
          label: 'Manager',
          value: 'manager',
        },
        {
          label: 'Staff',
          value: 'staff',
        },
      ],
      defaultValue: 'staff',
    },
  ],

  timestamps: true,
};
