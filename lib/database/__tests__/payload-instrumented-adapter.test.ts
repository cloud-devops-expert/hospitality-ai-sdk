/**
 * Tests for PayloadCMS Instrumented Adapter
 */

import { payloadInstrumentedAdapter } from '../payload-instrumented-adapter';

// Mock InstrumentedRDSClient
jest.mock('../instrumented-rds-client', () => ({
  InstrumentedRDSClient: jest.fn().mockImplementation(() => ({
    raw: {
      // Mock Drizzle instance
      select: jest.fn().mockReturnThis(),
      from: jest.fn().mockReturnThis(),
      where: jest.fn().mockResolvedValue([]),
      transaction: jest.fn(),
    },
  })),
}));

describe('payloadInstrumentedAdapter', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should create adapter with required config', () => {
    const adapter = payloadInstrumentedAdapter({
      resourceArn: 'arn:aws:rds:us-east-1:123:cluster:test',
      secretArn: 'arn:aws:secretsmanager:us-east-1:123:secret:test',
      database: 'testdb',
    });

    expect(adapter).toBeDefined();
  });

  it('should create adapter with custom config', () => {
    const adapter = payloadInstrumentedAdapter({
      resourceArn: 'arn:aws:rds:us-east-1:123:cluster:test',
      secretArn: 'arn:aws:secretsmanager:us-east-1:123:secret:test',
      database: 'testdb',
      region: 'us-west-2',
      debug: true,
      enableMetrics: false,
      metricsNamespace: 'CustomNamespace',
    });

    expect(adapter).toBeDefined();
  });

  it('should use default values for optional config', () => {
    const adapter = payloadInstrumentedAdapter({
      resourceArn: 'arn:aws:rds:us-east-1:123:cluster:test',
      secretArn: 'arn:aws:secretsmanager:us-east-1:123:secret:test',
      database: 'testdb',
    });

    expect(adapter).toBeDefined();
  });

  it('should return Drizzle-compatible instance', () => {
    const adapter = payloadInstrumentedAdapter({
      resourceArn: 'arn:aws:rds:us-east-1:123:cluster:test',
      secretArn: 'arn:aws:secretsmanager:us-east-1:123:secret:test',
      database: 'testdb',
    });

    // Should have Drizzle methods
    expect(adapter).toHaveProperty('select');
    expect(adapter).toHaveProperty('from');
    expect(adapter).toHaveProperty('transaction');
  });
});
