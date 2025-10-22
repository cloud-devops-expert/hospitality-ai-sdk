import { CollectionConfig } from 'payload/types';

export const ConstraintTemplates: CollectionConfig = {
  slug: 'constraint-templates',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'code', 'constraintType', 'defaultWeight', 'category'],
    group: 'Timefold Constraints',
    description: 'Reusable constraint definitions for hotel room allocation',
  },
  access: {
    read: () => true,
    create: ({ req: { user } }) => user?.role === 'admin',
    update: ({ req: { user } }) => user?.role === 'admin',
    delete: ({ req: { user } }) => user?.role === 'admin',
  },
  fields: [
    {
      name: 'code',
      type: 'text',
      required: true,
      unique: true,
      label: 'Constraint Code',
      admin: {
        description: 'Unique identifier (e.g., VIP_OCEAN_VIEW)',
      },
    },
    {
      name: 'name',
      type: 'text',
      required: true,
      label: 'Name',
    },
    {
      name: 'description',
      type: 'textarea',
      required: true,
      label: 'Description',
    },
    {
      name: 'constraintType',
      type: 'select',
      required: true,
      label: 'Constraint Type',
      options: [
        { label: 'Hard (Must never be violated)', value: 'HARD' },
        { label: 'Soft (Preference to optimize)', value: 'SOFT' },
      ],
    },
    {
      name: 'defaultWeight',
      type: 'number',
      required: true,
      defaultValue: 0,
      label: 'Default Weight',
      admin: {
        description: 'Positive = reward, Negative = penalty. HARD constraints use -1.',
      },
    },
    {
      name: 'category',
      type: 'select',
      required: true,
      label: 'Category',
      options: [
        { label: 'VIP', value: 'vip' },
        { label: 'Accessibility', value: 'accessibility' },
        { label: 'Preference', value: 'preference' },
        { label: 'Business', value: 'business' },
      ],
    },
    {
      name: 'parameterSchema',
      type: 'json',
      label: 'Parameter JSON Schema',
      admin: {
        description: 'JSON Schema for validating tenant-specific parameters',
      },
    },
    {
      name: 'exampleParameters',
      type: 'json',
      label: 'Example Parameters',
      admin: {
        description: 'Example parameter values',
      },
    },
    {
      name: 'javaClassName',
      type: 'text',
      label: 'Java Class Name',
      admin: {
        description: 'Name of Java constraint class (e.g., VipOceanViewConstraint)',
      },
    },
  ],
  timestamps: true,
};
