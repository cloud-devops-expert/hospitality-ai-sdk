import { CollectionConfig } from 'payload/types';

export const CaseStudies: CollectionConfig = {
  slug: 'case-studies',
  admin: {
    useAsTitle: 'hotelName',
    defaultColumns: ['hotelName', 'hotelSize', 'status', 'publishedAt'],
  },
  access: {
    read: ({ req: { user } }) => {
      if (user) return true;
      return {
        status: {
          equals: 'published',
        },
      };
    },
  },
  fields: [
    {
      name: 'hotelName',
      type: 'text',
      required: true,
      admin: {
        description: 'Use "Anonymous X-room hotel" if confidential',
      },
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'hotelSize',
      type: 'select',
      required: true,
      options: [
        { label: '1-10 rooms', value: '1-10' },
        { label: '11-50 rooms', value: '11-50' },
        { label: '51-500 rooms', value: '51-500' },
        { label: '501+ rooms', value: '501+' },
      ],
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'location',
      type: 'text',
      admin: {
        description: 'City, State/Country (or "Undisclosed" if confidential)',
      },
    },
    {
      name: 'propertyType',
      type: 'select',
      options: [
        { label: 'Boutique', value: 'boutique' },
        { label: 'Business Hotel', value: 'business' },
        { label: 'Resort', value: 'resort' },
        { label: 'Eco-Hotel', value: 'eco' },
        { label: 'Budget/Economy', value: 'budget' },
        { label: 'Luxury', value: 'luxury' },
        { label: 'Chain/Franchise', value: 'chain' },
      ],
    },
    {
      name: 'challenge',
      type: 'richText',
      required: true,
    },
    {
      name: 'solution',
      type: 'richText',
      required: true,
    },
    {
      name: 'results',
      type: 'group',
      fields: [
        {
          name: 'revparIncreasePct',
          type: 'number',
          admin: {
            description: 'RevPAR increase percentage (e.g., 15 for 15%)',
          },
        },
        {
          name: 'costReductionPct',
          type: 'number',
          admin: {
            description: 'Cost reduction percentage (e.g., 20 for 20%)',
          },
        },
        {
          name: 'timeSavedHours',
          type: 'number',
          admin: {
            description: 'Hours saved per month',
          },
        },
        {
          name: 'roiTimeframeMonths',
          type: 'number',
          admin: {
            description: 'Time to positive ROI in months',
          },
        },
        {
          name: 'otherMetrics',
          type: 'textarea',
          admin: {
            description: 'Additional metrics (guest satisfaction, etc.)',
          },
        },
      ],
    },
    {
      name: 'featuresUsed',
      type: 'array',
      fields: [
        {
          name: 'feature',
          type: 'select',
          options: [
            { label: 'Revenue Management', value: 'revenue-management' },
            { label: 'No-Show Prediction', value: 'no-show' },
            { label: 'Sentiment Analysis', value: 'sentiment' },
            { label: 'Review Response', value: 'review-response' },
            { label: 'Staff Scheduling', value: 'scheduling' },
            { label: 'Housekeeping Optimization', value: 'housekeeping' },
            { label: 'Energy Optimization', value: 'energy' },
            { label: 'Inventory Forecasting', value: 'inventory' },
            { label: 'Upsell Recommendations', value: 'upsell' },
            { label: 'Complaint Classification', value: 'complaints' },
            { label: 'Maintenance Prediction', value: 'maintenance' },
            { label: 'Check-in Time Prediction', value: 'checkin' },
          ],
        },
      ],
    },
    {
      name: 'testimonial',
      type: 'group',
      fields: [
        { name: 'quote', type: 'textarea' },
        { name: 'authorName', type: 'text' },
        { name: 'authorTitle', type: 'text' },
        { name: 'authorPhoto', type: 'upload', relationTo: 'media' },
      ],
    },
    {
      name: 'beforeScreenshot',
      type: 'upload',
      relationTo: 'media',
    },
    {
      name: 'afterScreenshot',
      type: 'upload',
      relationTo: 'media',
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'draft',
      options: [
        { label: 'Draft', value: 'draft' },
        { label: 'Published', value: 'published' },
        { label: 'Archived', value: 'archived' },
      ],
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'publishedAt',
      type: 'date',
      admin: {
        position: 'sidebar',
      },
    },
  ],
  timestamps: true,
  versions: {
    drafts: true,
  },
};
