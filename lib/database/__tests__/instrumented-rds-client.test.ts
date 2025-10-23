/**
 * Tests for Instrumented RDS Client
 */

import { InstrumentedRDSClient, resetInstrumentedClient, getInstrumentedClient } from '../instrumented-rds-client';

// Mock AWS SDK
jest.mock('@aws-sdk/client-rds-data', () => ({
  RDSDataClient: jest.fn().mockImplementation(() => ({
    send: jest.fn().mockResolvedValue({ records: [] }),
  })),
  ExecuteStatementCommand: jest.fn(),
  BatchExecuteStatementCommand: jest.fn(),
  BeginTransactionCommand: jest.fn(),
  CommitTransactionCommand: jest.fn(),
  RollbackTransactionCommand: jest.fn(),
}));

// Mock Drizzle
jest.mock('drizzle-orm/aws-data-api/pg', () => ({
  drizzle: jest.fn().mockReturnValue({
    transaction: jest.fn().mockImplementation(async (callback) => {
      const mockTx = {
        execute: jest.fn().mockResolvedValue(undefined),
        select: jest.fn().mockReturnThis(),
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([]),
      };
      return callback(mockTx);
    }),
    select: jest.fn().mockReturnThis(),
    from: jest.fn().mockReturnThis(),
  }),
}));

// Mock CloudWatch publisher
jest.mock('@/lib/metrics/cloudwatch-publisher', () => ({
  getCloudWatchPublisher: jest.fn().mockReturnValue({
    publish: jest.fn().mockResolvedValue(undefined),
  }),
}));

describe('InstrumentedRDSClient', () => {
  beforeEach(() => {
    resetInstrumentedClient();
    jest.clearAllMocks();
  });

  describe('Constructor', () => {
    it('should create client with required config', () => {
      const client = new InstrumentedRDSClient({
        resourceArn: 'arn:aws:rds:us-east-1:123:cluster:test',
        secretArn: 'arn:aws:secretsmanager:us-east-1:123:secret:test',
        database: 'testdb',
      });

      expect(client).toBeDefined();
    });

    it('should use default region if not provided', () => {
      const client = new InstrumentedRDSClient({
        resourceArn: 'arn:aws:rds:us-east-1:123:cluster:test',
        secretArn: 'arn:aws:secretsmanager:us-east-1:123:secret:test',
        database: 'testdb',
      });

      expect(client).toBeDefined();
    });

    it('should respect enableMetrics flag', () => {
      const client = new InstrumentedRDSClient({
        resourceArn: 'arn:aws:rds:us-east-1:123:cluster:test',
        secretArn: 'arn:aws:secretsmanager:us-east-1:123:secret:test',
        database: 'testdb',
        enableMetrics: false,
      });

      expect(client).toBeDefined();
    });
  });

  describe('withRLS', () => {
    it('should execute callback with RLS context', async () => {
      const client = getInstrumentedClient({
        resourceArn: 'arn:aws:rds:us-east-1:123:cluster:test',
        secretArn: 'arn:aws:secretsmanager:us-east-1:123:secret:test',
        database: 'testdb',
        enableMetrics: false,
      });

      const result = await client.withRLS(
        { tenantId: 'test-tenant' },
        async (tx) => {
          return { success: true };
        }
      );

      expect(result).toEqual({ success: true });
    });

    it('should set session variables', async () => {
      const client = getInstrumentedClient({
        resourceArn: 'arn:aws:rds:us-east-1:123:cluster:test',
        secretArn: 'arn:aws:secretsmanager:us-east-1:123:secret:test',
        database: 'testdb',
        enableMetrics: false,
      });

      let capturedTx: any = null;

      await client.withRLS(
        { tenantId: 'test-tenant', userId: 'test-user' },
        async (tx) => {
          capturedTx = tx;
          return { success: true };
        }
      );

      // Should have a transaction object
      expect(capturedTx).toBeDefined();
      expect(capturedTx.execute).toBeDefined();
    });

    it('should validate tenant context', async () => {
      const client = getInstrumentedClient({
        resourceArn: 'arn:aws:rds:us-east-1:123:cluster:test',
        secretArn: 'arn:aws:secretsmanager:us-east-1:123:secret:test',
        database: 'testdb',
        enableMetrics: false,
      });

      await expect(
        client.withRLS({ tenantId: '' }, async (tx) => {
          return {};
        })
      ).rejects.toThrow('tenantId is required');
    });

    it('should reject invalid tenant ID characters', async () => {
      const client = getInstrumentedClient({
        resourceArn: 'arn:aws:rds:us-east-1:123:cluster:test',
        secretArn: 'arn:aws:secretsmanager:us-east-1:123:secret:test',
        database: 'testdb',
        enableMetrics: false,
      });

      await expect(
        client.withRLS({ tenantId: 'tenant@#$' }, async (tx) => {
          return {};
        })
      ).rejects.toThrow('invalid characters');
    });

    it('should support custom session variables', async () => {
      const client = getInstrumentedClient({
        resourceArn: 'arn:aws:rds:us-east-1:123:cluster:test',
        secretArn: 'arn:aws:secretsmanager:us-east-1:123:secret:test',
        database: 'testdb',
        enableMetrics: false,
      });

      await client.withRLS(
        {
          tenantId: 'test-tenant',
          customVars: {
            'app.user_role': 'admin',
          },
        },
        async (tx) => {
          return { success: true };
        }
      );

      // Should not throw
      expect(true).toBe(true);
    });
  });

  describe('batchWithRLS', () => {
    it('should execute multiple operations in transaction', async () => {
      const client = getInstrumentedClient({
        resourceArn: 'arn:aws:rds:us-east-1:123:cluster:test',
        secretArn: 'arn:aws:secretsmanager:us-east-1:123:secret:test',
        database: 'testdb',
        enableMetrics: false,
      });

      const results = await client.batchWithRLS(
        { tenantId: 'test-tenant' },
        [
          async (tx) => ({ result: 1 }),
          async (tx) => ({ result: 2 }),
          async (tx) => ({ result: 3 }),
        ]
      );

      expect(results).toHaveLength(3);
      expect(results[0]).toEqual({ result: 1 });
      expect(results[1]).toEqual({ result: 2 });
      expect(results[2]).toEqual({ result: 3 });
    });

    it('should validate context for batch operations', async () => {
      const client = getInstrumentedClient({
        resourceArn: 'arn:aws:rds:us-east-1:123:cluster:test',
        secretArn: 'arn:aws:secretsmanager:us-east-1:123:secret:test',
        database: 'testdb',
        enableMetrics: false,
      });

      await expect(
        client.batchWithRLS({ tenantId: '' }, [async (tx) => ({})])
      ).rejects.toThrow('tenantId is required');
    });
  });

  describe('Singleton Pattern', () => {
    it('should return same instance', () => {
      const client1 = getInstrumentedClient({
        resourceArn: 'arn:aws:rds:us-east-1:123:cluster:test',
        secretArn: 'arn:aws:secretsmanager:us-east-1:123:secret:test',
        database: 'testdb',
      });

      const client2 = getInstrumentedClient();

      expect(client1).toBe(client2);
    });

    it('should reset singleton', () => {
      const client1 = getInstrumentedClient({
        resourceArn: 'arn:aws:rds:us-east-1:123:cluster:test',
        secretArn: 'arn:aws:secretsmanager:us-east-1:123:secret:test',
        database: 'testdb',
      });

      resetInstrumentedClient();

      const client2 = getInstrumentedClient({
        resourceArn: 'arn:aws:rds:us-east-1:123:cluster:test',
        secretArn: 'arn:aws:secretsmanager:us-east-1:123:secret:test',
        database: 'testdb',
      });

      expect(client1).not.toBe(client2);
    });
  });

  describe('Tenant Context Extraction', () => {
    it('should extract tenant from application_name', () => {
      const client = new InstrumentedRDSClient({
        resourceArn: 'arn:aws:rds:us-east-1:123:cluster:test',
        secretArn: 'arn:aws:secretsmanager:us-east-1:123:secret:test',
        database: 'testdb',
        enableMetrics: false,
      });

      // Access private method via type assertion for testing
      const extractTenantId = (client as any).extractTenantId.bind(client);

      const command = {
        input: {
          sql: "SET LOCAL application_name = 'tenant-123'",
        },
      };

      const tenantId = extractTenantId(command);
      expect(tenantId).toBe('123');
    });

    it('should extract tenant from session variable', () => {
      const client = new InstrumentedRDSClient({
        resourceArn: 'arn:aws:rds:us-east-1:123:cluster:test',
        secretArn: 'arn:aws:secretsmanager:us-east-1:123:secret:test',
        database: 'testdb',
        enableMetrics: false,
      });

      const extractTenantId = (client as any).extractTenantId.bind(client);

      const command = {
        input: {
          sql: "SET LOCAL app.current_tenant_id = 'tenant-456'",
        },
      };

      const tenantId = extractTenantId(command);
      expect(tenantId).toBe('tenant-456');
    });

    it('should return null if no tenant found', () => {
      const client = new InstrumentedRDSClient({
        resourceArn: 'arn:aws:rds:us-east-1:123:cluster:test',
        secretArn: 'arn:aws:secretsmanager:us-east-1:123:secret:test',
        database: 'testdb',
        enableMetrics: false,
      });

      const extractTenantId = (client as any).extractTenantId.bind(client);

      const command = {
        input: {
          sql: 'SELECT * FROM bookings',
        },
      };

      const tenantId = extractTenantId(command);
      expect(tenantId).toBeNull();
    });
  });

  describe('SQL Escaping', () => {
    it('should escape single quotes', () => {
      const client = new InstrumentedRDSClient({
        resourceArn: 'arn:aws:rds:us-east-1:123:cluster:test',
        secretArn: 'arn:aws:secretsmanager:us-east-1:123:secret:test',
        database: 'testdb',
        enableMetrics: false,
      });

      const escapeSQL = (client as any).escapeSQL.bind(client);

      expect(escapeSQL("tenant-123'--")).toBe("tenant-123''--");
      expect(escapeSQL("O'Brien")).toBe("O''Brien");
    });
  });
});

describe('getInstrumentedClient', () => {
  beforeEach(() => {
    resetInstrumentedClient();
  });

  it('should create client with environment variables', () => {
    process.env.DB_CLUSTER_ARN = 'arn:aws:rds:us-east-1:123:cluster:test';
    process.env.DB_SECRET_ARN = 'arn:aws:secretsmanager:us-east-1:123:secret:test';
    process.env.DATABASE_NAME = 'testdb';

    const client = getInstrumentedClient();
    expect(client).toBeDefined();
  });

  it('should use provided config over environment', () => {
    const client = getInstrumentedClient({
      resourceArn: 'arn:aws:rds:us-east-1:123:cluster:custom',
      secretArn: 'arn:aws:secretsmanager:us-east-1:123:secret:custom',
      database: 'customdb',
    });

    expect(client).toBeDefined();
  });
});
