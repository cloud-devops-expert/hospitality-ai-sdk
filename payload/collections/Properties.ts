/**
 * Properties Collection with RLS
 */

import type { CollectionConfig } from 'payload/types';

export const Properties: CollectionConfig = {
  slug: 'properties',

  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'address', 'type', 'status'],
    group: 'Assets',
  },

  fields: [
    {
      name: 'tenant_id',
      type: 'text',
      required: true,
      admin: {
        readOnly: true,
        hidden: true,
      },
    },
    {
      name: 'name',
      type: 'text',
      required: true,
      label: 'Property Name',
    },
    {
      name: 'address',
      type: 'textarea',
      required: true,
      label: 'Address',
    },
    {
      name: 'type',
      type: 'select',
      options: [
        { label: 'Hotel', value: 'hotel' },
        { label: 'Apartment', value: 'apartment' },
        { label: 'Villa', value: 'villa' },
      ],
      defaultValue: 'hotel',
    },
    {
      name: 'status',
      type: 'select',
      options: [
        { label: 'Active', value: 'active' },
        { label: 'Inactive', value: 'inactive' },
      ],
      defaultValue: 'active',
    },
  ],

  timestamps: true,
};
