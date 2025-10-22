import { CollectionConfig } from 'payload/types';

export const Tenants: CollectionConfig = {
  slug: 'tenants',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'slug', 'hotelType', 'totalRooms'],
    group: 'Timefold Constraints',
    description: 'Hotel properties (multi-tenant entities)',
  },
  access: {
    read: () => true,
    create: ({ req: { user } }) => user?.role === 'admin',
    update: ({ req: { user } }) => user?.role === 'admin',
    delete: ({ req: { user } }) => user?.role === 'admin',
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      label: 'Hotel Name',
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      label: 'Slug',
      admin: {
        description: 'URL-friendly identifier (e.g., oceanview-resort)',
      },
    },
    {
      name: 'hotelType',
      type: 'select',
      required: true,
      label: 'Hotel Type',
      options: [
        { label: 'Luxury', value: 'luxury' },
        { label: 'Budget', value: 'budget' },
        { label: 'Business', value: 'business' },
        { label: 'Resort', value: 'resort' },
      ],
    },
    {
      name: 'totalRooms',
      type: 'number',
      required: true,
      defaultValue: 0,
      label: 'Total Rooms',
      min: 0,
    },
    {
      name: 'timezone',
      type: 'text',
      required: true,
      defaultValue: 'UTC',
      label: 'Timezone',
      admin: {
        description: 'IANA timezone (e.g., America/New_York)',
      },
    },
  ],
  timestamps: true,
};
