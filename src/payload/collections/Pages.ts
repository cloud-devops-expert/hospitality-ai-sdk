import { CollectionConfig } from 'payload/types';

export const Pages: CollectionConfig = {
  slug: 'pages',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'slug', 'template', 'status'],
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
    create: ({ req: { user } }) => user?.role === 'admin',
    update: ({ req: { user } }) => user?.role === 'admin',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
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
      name: 'template',
      type: 'select',
      required: true,
      options: [
        { label: 'Landing Page', value: 'landing' },
        { label: 'Features', value: 'features' },
        { label: 'Pricing', value: 'pricing' },
        { label: 'About', value: 'about' },
        { label: 'Contact', value: 'contact' },
        { label: 'Custom', value: 'custom' },
      ],
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'blocks',
      type: 'blocks',
      blocks: [
        {
          slug: 'hero',
          fields: [
            { name: 'headline', type: 'text', required: true },
            { name: 'subheadline', type: 'textarea' },
            { name: 'ctaPrimary', type: 'text' },
            { name: 'ctaPrimaryLink', type: 'text' },
            { name: 'ctaSecondary', type: 'text' },
            { name: 'ctaSecondaryLink', type: 'text' },
            { name: 'backgroundImage', type: 'upload', relationTo: 'media' },
          ],
        },
        {
          slug: 'features',
          fields: [
            { name: 'title', type: 'text' },
            {
              name: 'featureList',
              type: 'array',
              fields: [
                { name: 'title', type: 'text', required: true },
                { name: 'description', type: 'textarea' },
                { name: 'icon', type: 'text' },
                { name: 'link', type: 'text' },
              ],
            },
          ],
        },
        {
          slug: 'pricingTable',
          fields: [
            { name: 'title', type: 'text' },
            {
              name: 'tiers',
              type: 'array',
              fields: [
                { name: 'name', type: 'text', required: true },
                { name: 'price', type: 'text', required: true },
                { name: 'description', type: 'textarea' },
                {
                  name: 'features',
                  type: 'array',
                  fields: [{ name: 'feature', type: 'text' }],
                },
                { name: 'cta', type: 'text' },
                { name: 'ctaLink', type: 'text' },
                { name: 'highlighted', type: 'checkbox' },
              ],
            },
          ],
        },
        {
          slug: 'codeExample',
          fields: [
            { name: 'title', type: 'text' },
            { name: 'code', type: 'code', required: true },
            { name: 'language', type: 'text', defaultValue: 'typescript' },
            { name: 'description', type: 'textarea' },
          ],
        },
        {
          slug: 'testimonials',
          fields: [
            { name: 'title', type: 'text' },
            {
              name: 'testimonialList',
              type: 'array',
              fields: [
                { name: 'quote', type: 'textarea', required: true },
                { name: 'author', type: 'text', required: true },
                { name: 'role', type: 'text' },
                { name: 'company', type: 'text' },
                { name: 'avatar', type: 'upload', relationTo: 'media' },
              ],
            },
          ],
        },
        {
          slug: 'cta',
          fields: [
            { name: 'title', type: 'text', required: true },
            { name: 'description', type: 'textarea' },
            { name: 'buttonText', type: 'text', required: true },
            { name: 'buttonLink', type: 'text', required: true },
            { name: 'secondaryButtonText', type: 'text' },
            { name: 'secondaryButtonLink', type: 'text' },
          ],
        },
      ],
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'draft',
      options: [
        { label: 'Draft', value: 'draft' },
        { label: 'Published', value: 'published' },
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
