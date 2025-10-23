import {
  initializeRules,
  shouldExecuteRule,
  executeRule,
  calculateAutomationStats,
} from '../engine';
import { AutomationRule, AutomationExecution } from '../types';

// Mock uuid module
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'mock-uuid-' + Math.random()),
}));

describe('Automation Engine', () => {
  describe('initializeRules', () => {
    it('should initialize default rules', () => {
      const rules = initializeRules();

      expect(rules).toHaveLength(6);
      expect(rules.every((rule) => rule.id)).toBe(true);
      expect(rules.every((rule) => rule.createdAt)).toBe(true);
      expect(rules.every((rule) => rule.executionCount === 0)).toBe(true);
    });

    it('should create unique IDs for each rule', () => {
      const rules = initializeRules();
      const ids = rules.map((r) => r.id);
      const uniqueIds = new Set(ids);

      expect(uniqueIds.size).toBe(rules.length);
    });

    it('should include high no-show alert rule', () => {
      const rules = initializeRules();
      const noShowRule = rules.find((r) => r.name === 'High No-Show Alert');

      expect(noShowRule).toBeDefined();
      expect(noShowRule?.trigger.type).toBe('no_show_detected');
      expect(noShowRule?.actions.length).toBeGreaterThan(0);
    });
  });

  describe('shouldExecuteRule', () => {
    let rule: AutomationRule;

    beforeEach(() => {
      const rules = initializeRules();
      rule = rules[0]; // High No-Show Alert
    });

    it('should return false if rule is disabled', () => {
      rule.enabled = false;
      const context = { probability: 0.8 };

      expect(shouldExecuteRule(rule, context)).toBe(false);
    });

    it('should return true if conditions are met', () => {
      rule.enabled = true;
      rule.trigger.conditions = [
        {
          field: 'probability',
          operator: 'greater_than',
          value: 0.75,
        },
      ];
      const context = { probability: 0.8 };

      expect(shouldExecuteRule(rule, context)).toBe(true);
    });

    it('should return false if conditions are not met', () => {
      rule.enabled = true;
      rule.trigger.conditions = [
        {
          field: 'probability',
          operator: 'greater_than',
          value: 0.75,
        },
      ];
      const context = { probability: 0.5 };

      expect(shouldExecuteRule(rule, context)).toBe(false);
    });

    it('should handle equals operator', () => {
      rule.enabled = true;
      rule.trigger.conditions = [
        {
          field: 'status',
          operator: 'equals',
          value: 'urgent',
        },
      ];

      expect(shouldExecuteRule(rule, { status: 'urgent' })).toBe(true);
      expect(shouldExecuteRule(rule, { status: 'normal' })).toBe(false);
    });

    it('should handle not_equals operator', () => {
      rule.enabled = true;
      rule.trigger.conditions = [
        {
          field: 'status',
          operator: 'not_equals',
          value: 'normal',
        },
      ];

      expect(shouldExecuteRule(rule, { status: 'urgent' })).toBe(true);
      expect(shouldExecuteRule(rule, { status: 'normal' })).toBe(false);
    });

    it('should handle less_than operator', () => {
      rule.enabled = true;
      rule.trigger.conditions = [
        {
          field: 'rating',
          operator: 'less_than',
          value: 3,
        },
      ];

      expect(shouldExecuteRule(rule, { rating: 2 })).toBe(true);
      expect(shouldExecuteRule(rule, { rating: 4 })).toBe(false);
    });

    it('should handle contains operator', () => {
      rule.enabled = true;
      rule.trigger.conditions = [
        {
          field: 'message',
          operator: 'contains',
          value: 'urgent',
        },
      ];

      expect(shouldExecuteRule(rule, { message: 'This is urgent!' })).toBe(true);
      expect(shouldExecuteRule(rule, { message: 'This is normal' })).toBe(false);
    });

    it('should handle not_contains operator', () => {
      rule.enabled = true;
      rule.trigger.conditions = [
        {
          field: 'message',
          operator: 'not_contains',
          value: 'spam',
        },
      ];

      expect(shouldExecuteRule(rule, { message: 'This is urgent!' })).toBe(true);
      expect(shouldExecuteRule(rule, { message: 'This is spam' })).toBe(false);
    });

    it('should handle multiple conditions with AND logic', () => {
      rule.enabled = true;
      rule.trigger.conditions = [
        {
          field: 'probability',
          operator: 'greater_than',
          value: 0.7,
        },
        {
          field: 'priority',
          operator: 'equals',
          value: 'high',
        },
      ];

      expect(
        shouldExecuteRule(rule, { probability: 0.8, priority: 'high' })
      ).toBe(true);
      expect(
        shouldExecuteRule(rule, { probability: 0.8, priority: 'low' })
      ).toBe(false);
      expect(
        shouldExecuteRule(rule, { probability: 0.5, priority: 'high' })
      ).toBe(false);
    });
  });

  describe('executeRule', () => {
    let rule: AutomationRule;

    beforeEach(() => {
      const rules = initializeRules();
      rule = rules[0];
    });

    it('should execute rule and create execution record', async () => {
      const context = { probability: 0.8 };
      const execution = await executeRule(rule, context);

      expect(execution.id).toBeDefined();
      expect(execution.ruleId).toBe(rule.id);
      expect(execution.ruleName).toBe(rule.name);
      expect(execution.triggeredAt).toBeInstanceOf(Date);
      expect(execution.completedAt).toBeInstanceOf(Date);
      expect(execution.status).toBe('completed');
      expect(execution.context).toEqual(context);
    });

    it('should execute all actions in the rule', async () => {
      const context = {};
      const execution = await executeRule(rule, context);

      expect(execution.actions.length).toBe(rule.actions.length);
      expect(execution.actions.every((a) => a.status === 'completed')).toBe(true);
      expect(execution.actions.every((a) => a.executedAt)).toBe(true);
    });

    it('should track action execution times', async () => {
      const context = {};
      const execution = await executeRule(rule, context);

      expect(
        execution.actions.every(
          (a) => a.executedAt && a.executedAt >= execution.triggeredAt
        )
      ).toBe(true);
    });

    it('should complete successfully for valid rule', async () => {
      const context = { probability: 0.9 };
      const execution = await executeRule(rule, context);

      expect(execution.status).toBe('completed');
      expect(execution.completedAt).toBeDefined();
      expect(
        execution.completedAt &&
          execution.completedAt.getTime() >= execution.triggeredAt.getTime()
      ).toBe(true);
    });
  });

  describe('calculateAutomationStats', () => {
    let rules: AutomationRule[];
    let executions: AutomationExecution[];

    beforeEach(() => {
      rules = initializeRules();

      // Create mock executions
      executions = [
        {
          id: '1',
          ruleId: rules[0].id,
          ruleName: rules[0].name,
          triggeredAt: new Date('2024-01-01T10:00:00'),
          completedAt: new Date('2024-01-01T10:00:05'),
          status: 'completed',
          actions: [
            {
              type: 'send_email',
              status: 'completed',
              executedAt: new Date('2024-01-01T10:00:02'),
            },
          ],
          context: {},
        },
        {
          id: '2',
          ruleId: rules[0].id,
          ruleName: rules[0].name,
          triggeredAt: new Date('2024-01-01T11:00:00'),
          completedAt: new Date('2024-01-01T11:00:03'),
          status: 'completed',
          actions: [
            {
              type: 'send_email',
              status: 'completed',
              executedAt: new Date('2024-01-01T11:00:02'),
            },
          ],
          context: {},
        },
        {
          id: '3',
          ruleId: rules[1].id,
          ruleName: rules[1].name,
          triggeredAt: new Date('2024-01-01T12:00:00'),
          completedAt: new Date('2024-01-01T12:00:10'),
          status: 'failed',
          actions: [
            {
              type: 'create_task',
              status: 'failed',
              error: 'Test error',
            },
          ],
          context: {},
        },
      ];
    });

    it('should calculate total rules correctly', () => {
      const stats = calculateAutomationStats(rules, executions);

      expect(stats.totalRules).toBe(rules.length);
    });

    it('should calculate active rules correctly', () => {
      rules[0].enabled = true;
      rules[1].enabled = false;
      rules[2].enabled = true;

      const stats = calculateAutomationStats(rules, executions);

      expect(stats.activeRules).toBe(5); // All rules are enabled by default except one we disabled
    });

    it('should calculate total executions correctly', () => {
      const stats = calculateAutomationStats(rules, executions);

      expect(stats.totalExecutions).toBe(executions.length);
    });

    it('should calculate success rate correctly', () => {
      const stats = calculateAutomationStats(rules, executions);

      expect(stats.successRate).toBeCloseTo(2 / 3, 2); // 2 completed, 1 failed
    });

    it('should calculate average execution time correctly', () => {
      const stats = calculateAutomationStats(rules, executions);

      // Execution 1: 5 seconds, Execution 2: 3 seconds, Execution 3: 10 seconds
      // Average: (5 + 3 + 10) / 3 = 6 seconds
      expect(stats.avgExecutionTime).toBeCloseTo(6, 0);
    });

    it('should identify most triggered rules', () => {
      const stats = calculateAutomationStats(rules, executions);

      expect(stats.mostTriggered.length).toBeGreaterThan(0);
      expect(stats.mostTriggered[0].ruleId).toBe(rules[0].id);
      expect(stats.mostTriggered[0].count).toBe(2);
    });

    it('should sort most triggered rules by count', () => {
      const stats = calculateAutomationStats(rules, executions);

      for (let i = 1; i < stats.mostTriggered.length; i++) {
        expect(stats.mostTriggered[i - 1].count).toBeGreaterThanOrEqual(
          stats.mostTriggered[i].count
        );
      }
    });

    it('should handle empty executions', () => {
      const stats = calculateAutomationStats(rules, []);

      expect(stats.totalExecutions).toBe(0);
      expect(stats.successRate).toBe(0);
      expect(stats.avgExecutionTime).toBe(0);
      expect(stats.mostTriggered).toEqual([]);
    });

    it('should limit most triggered to top 5', () => {
      // Create 10 different executions for different rules
      const manyExecutions = rules.map((rule, i) => ({
        id: `exec-${i}`,
        ruleId: rule.id,
        ruleName: rule.name,
        triggeredAt: new Date(),
        completedAt: new Date(),
        status: 'completed' as const,
        actions: [],
        context: {},
      }));

      const stats = calculateAutomationStats(rules, manyExecutions);

      expect(stats.mostTriggered.length).toBeLessThanOrEqual(5);
    });
  });

  describe('Rule Configuration', () => {
    it('should have VIP welcome automation rule', () => {
      const rules = initializeRules();
      const vipRule = rules.find((r) => r.name === 'VIP Welcome Automation');

      expect(vipRule).toBeDefined();
      expect(vipRule?.trigger.type).toBe('vip_booking');
      expect(vipRule?.actions).toContainEqual(
        expect.objectContaining({
          type: 'create_task',
        })
      );
    });

    it('should have dynamic pricing rule', () => {
      const rules = initializeRules();
      const pricingRule = rules.find(
        (r) => r.name === 'Dynamic Pricing - High Demand'
      );

      expect(pricingRule).toBeDefined();
      expect(pricingRule?.trigger.type).toBe('occupancy_threshold');
      expect(pricingRule?.actions).toContainEqual(
        expect.objectContaining({
          type: 'adjust_price',
        })
      );
    });

    it('should have negative review response rule', () => {
      const rules = initializeRules();
      const reviewRule = rules.find(
        (r) => r.name === 'Negative Review Response'
      );

      expect(reviewRule).toBeDefined();
      expect(reviewRule?.trigger.type).toBe('negative_review');
      expect(reviewRule?.trigger.conditions).toContainEqual(
        expect.objectContaining({
          field: 'rating',
          operator: 'less_than',
          value: 3,
        })
      );
    });

    it('should have time-based morning briefing rule', () => {
      const rules = initializeRules();
      const briefingRule = rules.find(
        (r) => r.name === 'Morning Briefing Generation'
      );

      expect(briefingRule).toBeDefined();
      expect(briefingRule?.trigger.type).toBe('time_based');
      expect(briefingRule?.trigger.schedule).toBe('0 6 * * *');
    });

    it('should have maintenance escalation rule', () => {
      const rules = initializeRules();
      const maintenanceRule = rules.find(
        (r) => r.name === 'Maintenance Escalation'
      );

      expect(maintenanceRule).toBeDefined();
      expect(maintenanceRule?.trigger.type).toBe('maintenance_required');
      expect(maintenanceRule?.actions).toContainEqual(
        expect.objectContaining({
          type: 'send_sms',
        })
      );
    });
  });
});
