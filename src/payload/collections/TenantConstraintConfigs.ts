import { CollectionConfig } from 'payload/types';

export const TenantConstraintConfigs: CollectionConfig = {
  slug: 'tenant-constraint-configs',
  admin: {
    useAsTitle: 'configName',
    defaultColumns: ['tenant', 'constraintTemplate', 'enabled', 'weight'],
    group: 'Timefold Constraints',
    description: 'Tenant-specific constraint configurations',
  },
  access: {
    read: () => true,
    create: ({ req: { user } }) => user?.role === 'admin' || user?.role === 'editor',
    update: ({ req: { user } }) => user?.role === 'admin' || user?.role === 'editor',
    delete: ({ req: { user } }) => user?.role === 'admin',
  },
  fields: [
    {
      name: 'configName',
      type: 'text',
      admin: {
        hidden: true,
      },
      hooks: {
        beforeChange: [
          ({ data }) => {
            // Auto-generate display name from tenant + template
            if (data.tenant && data.constraintTemplate) {
              return `${data.tenant} - ${data.constraintTemplate}`;
            }
            return data.configName || 'New Config';
          },
        ],
      },
    },
    {
      name: 'tenant',
      type: 'relationship',
      relationTo: 'tenants',
      required: true,
      label: 'Hotel Property',
      hasMany: false,
    },
    {
      name: 'constraintTemplate',
      type: 'relationship',
      relationTo: 'constraint-templates',
      required: true,
      label: 'Constraint',
      hasMany: false,
    },
    {
      name: 'enabled',
      type: 'checkbox',
      required: true,
      defaultValue: true,
      label: 'Enabled',
      admin: {
        description: 'Turn this constraint on/off for this tenant',
      },
    },
    {
      name: 'weight',
      type: 'number',
      required: true,
      defaultValue: 0,
      label: 'Weight',
      admin: {
        description:
          'Override default weight. Higher = more important (positive = reward, negative = penalty)',
      },
    },
    {
      name: 'parameters',
      type: 'json',
      label: 'Parameters',
      admin: {
        description: 'Tenant-specific parameters (JSON object)',
      },
    },
    {
      name: 'notes',
      type: 'textarea',
      label: 'Notes',
      admin: {
        description: 'Internal notes about this configuration',
      },
    },
  ],
  timestamps: true,
  hooks: {
    afterChange: [
      async ({ doc, operation }) => {
        // Log to console when constraint configs change
        console.warn(
          `[Timefold] Constraint config ${operation}: Tenant=${doc.tenant}, Template=${doc.constraintTemplate}, Enabled=${doc.enabled}`
        );

        // TODO: Trigger Timefold solver cache invalidation via API
        // This would call the Java microservice to reload constraints for this tenant
      },
    ],
  },
};
