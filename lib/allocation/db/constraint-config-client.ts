/**
 * Database client for reading tenant-specific constraint configurations
 * Reads from PostgreSQL tables created in 001_multi_tenant_constraints.sql
 */

import { Pool } from 'pg';
import type { TenantConstraintConfig, ConstraintTemplate } from '../types/timefold';

export class ConstraintConfigClient {
  private pool: Pool;

  constructor(connectionString?: string) {
    this.pool = new Pool({
      connectionString: connectionString || process.env.DATABASE_URL,
    });
  }

  /**
   * Get all enabled constraints for a tenant
   */
  async getTenantConstraints(tenantId: string): Promise<TenantConstraintConfig[]> {
    const query = `
      SELECT
        tcc.id,
        tcc.tenant_id AS "tenantId",
        tcc.constraint_template_id AS "templateId",
        tcc.enabled,
        tcc.weight,
        tcc.parameters,
        tcc.notes,
        ct.id AS "template.id",
        ct.code AS "template.code",
        ct.name AS "template.name",
        ct.description AS "template.description",
        ct.constraint_type AS "template.constraintType",
        ct.default_weight AS "template.defaultWeight",
        ct.category AS "template.category",
        ct.parameter_schema AS "template.parameterSchema",
        ct.example_parameters AS "template.exampleParameters",
        ct.java_class_name AS "template.javaClassName"
      FROM tenant_constraint_configs tcc
      JOIN constraint_templates ct ON tcc.constraint_template_id = ct.id
      WHERE tcc.tenant_id = $1
        AND tcc.enabled = true
        AND upper(tcc.valid_period) IS NULL
        AND upper(ct.valid_period) IS NULL
      ORDER BY ct.constraint_type DESC, tcc.weight DESC
    `;

    const result = await this.pool.query(query, [tenantId]);

    return result.rows.map((row) => ({
      id: row.id,
      tenantId: row.tenantId,
      templateId: row.templateId,
      enabled: row.enabled,
      weight: row.weight,
      parameters: row.parameters || {},
      notes: row.notes,
      template: {
        id: row['template.id'],
        code: row['template.code'],
        name: row['template.name'],
        description: row['template.description'],
        constraintType: row['template.constraintType'],
        defaultWeight: row['template.defaultWeight'],
        category: row['template.category'],
        parameterSchema: row['template.parameterSchema'],
        exampleParameters: row['template.exampleParameters'],
        javaClassName: row['template.javaClassName'],
      },
    }));
  }

  /**
   * Get all constraint templates
   */
  async getAllTemplates(): Promise<ConstraintTemplate[]> {
    const query = `
      SELECT
        id,
        code,
        name,
        description,
        constraint_type AS "constraintType",
        default_weight AS "defaultWeight",
        category,
        parameter_schema AS "parameterSchema",
        example_parameters AS "exampleParameters",
        java_class_name AS "javaClassName"
      FROM constraint_templates
      WHERE upper(valid_period) IS NULL
      ORDER BY constraint_type DESC, default_weight DESC
    `;

    const result = await this.pool.query(query);
    return result.rows;
  }

  /**
   * Get tenant information
   */
  async getTenant(tenantId: string) {
    const query = `
      SELECT
        id,
        name,
        slug,
        hotel_type AS "hotelType",
        total_rooms AS "totalRooms",
        timezone
      FROM tenants
      WHERE id = $1
        AND upper(valid_period) IS NULL
    `;

    const result = await this.pool.query(query, [tenantId]);
    return result.rows[0] || null;
  }

  /**
   * Get constraint configuration change history
   */
  async getConfigHistory(tenantId: string, limit: number = 10) {
    const query = `
      SELECT
        cch.id,
        cch.change_type AS "changeType",
        cch.old_values AS "oldValues",
        cch.new_values AS "newValues",
        cch.change_reason AS "changeReason",
        cch.created_at AS "createdAt",
        ct.name AS "constraintName",
        u.name AS "changedBy"
      FROM constraint_config_history cch
      JOIN tenant_constraint_configs tcc ON cch.config_id = tcc.id
      JOIN constraint_templates ct ON tcc.constraint_template_id = ct.id
      LEFT JOIN users u ON cch.changed_by = u.id
      WHERE tcc.tenant_id = $1
      ORDER BY cch.created_at DESC
      LIMIT $2
    `;

    const result = await this.pool.query(query, [tenantId, limit]);
    return result.rows;
  }

  /**
   * Close database connection
   */
  async close() {
    await this.pool.end();
  }
}

// Singleton instance
let client: ConstraintConfigClient | null = null;

export function getConstraintConfigClient(): ConstraintConfigClient {
  if (!client) {
    client = new ConstraintConfigClient();
  }
  return client;
}
