/**
 * Automation Engine
 * Execute rules and workflows automatically
 */

import { v4 as uuid } from 'uuid';
import {
  AutomationRule,
  AutomationExecution,
  Condition,
  ActionType,
  ConditionOperator,
  AutomationStats,
} from './types';

/**
 * Pre-configured automation rules
 */
export const DEFAULT_RULES: Omit<
  AutomationRule,
  'id' | 'createdAt' | 'updatedAt' | 'lastExecuted' | 'executionCount'
>[] = [
  {
    name: 'High No-Show Alert',
    description:
      'Notify staff when a booking has >75% no-show probability',
    enabled: true,
    trigger: {
      type: 'no_show_detected',
      conditions: [
        {
          field: 'probability',
          operator: 'greater_than',
          value: 0.75,
        },
      ],
    },
    actions: [
      {
        type: 'notify_staff',
        params: {
          channel: 'slack',
          message: 'High-risk no-show detected',
        },
      },
      {
        type: 'send_email',
        params: {
          to: 'guest',
          template: 'reminder',
        },
        delay: 0,
      },
    ],
  },
  {
    name: 'VIP Welcome Automation',
    description: 'Automatically prepare VIP welcome package',
    enabled: true,
    trigger: {
      type: 'vip_booking',
    },
    actions: [
      {
        type: 'create_task',
        params: {
          type: 'housekeeping',
          title: 'Prepare VIP welcome amenities',
          priority: 'high',
        },
      },
      {
        type: 'notify_staff',
        params: {
          role: 'concierge',
          message: 'VIP arrival - prepare personalized service',
        },
      },
    ],
  },
  {
    name: 'Dynamic Pricing - High Demand',
    description: 'Increase prices when occupancy exceeds 85%',
    enabled: true,
    trigger: {
      type: 'occupancy_threshold',
      conditions: [
        {
          field: 'occupancy',
          operator: 'greater_than',
          value: 85,
        },
      ],
    },
    actions: [
      {
        type: 'adjust_price',
        params: {
          adjustment: 1.2, // 20% increase
          duration: '24h',
        },
      },
      {
        type: 'notify_staff',
        params: {
          role: 'revenue_manager',
          message: 'Automatic price increase due to high demand',
        },
      },
    ],
  },
  {
    name: 'Negative Review Response',
    description: 'Alert management for negative reviews',
    enabled: true,
    trigger: {
      type: 'negative_review',
      conditions: [
        {
          field: 'rating',
          operator: 'less_than',
          value: 3,
        },
      ],
    },
    actions: [
      {
        type: 'notify_staff',
        params: {
          role: 'manager',
          message: 'Urgent: Negative review requires response',
          priority: 'critical',
        },
      },
      {
        type: 'create_task',
        params: {
          type: 'customer_service',
          title: 'Respond to negative review',
          priority: 'urgent',
        },
      },
    ],
  },
  {
    name: 'Morning Briefing Generation',
    description: 'Generate daily briefing at 6 AM',
    enabled: true,
    trigger: {
      type: 'time_based',
      schedule: '0 6 * * *', // 6 AM daily
    },
    actions: [
      {
        type: 'generate_report',
        params: {
          type: 'daily_briefing',
        },
      },
      {
        type: 'send_email',
        params: {
          to: 'management',
          subject: 'Daily Operations Briefing',
        },
      },
    ],
  },
  {
    name: 'Maintenance Escalation',
    description: 'Escalate urgent maintenance issues',
    enabled: true,
    trigger: {
      type: 'maintenance_required',
      conditions: [
        {
          field: 'priority',
          operator: 'equals',
          value: 'urgent',
        },
      ],
    },
    actions: [
      {
        type: 'notify_staff',
        params: {
          role: 'maintenance_supervisor',
          message: 'Urgent maintenance issue requires immediate attention',
        },
      },
      {
        type: 'send_sms',
        params: {
          to: 'on_call_technician',
          message: 'Urgent maintenance alert',
        },
      },
    ],
  },
];

/**
 * Evaluate condition against context
 */
function evaluateCondition(
  condition: Condition,
  context: Record<string, any>
): boolean {
  const value = context[condition.field];

  switch (condition.operator) {
    case 'equals':
      return value === condition.value;
    case 'not_equals':
      return value !== condition.value;
    case 'greater_than':
      return Number(value) > Number(condition.value);
    case 'less_than':
      return Number(value) < Number(condition.value);
    case 'contains':
      return String(value).includes(String(condition.value));
    case 'not_contains':
      return !String(value).includes(String(condition.value));
    default:
      return false;
  }
}

/**
 * Check if rule should execute
 */
export function shouldExecuteRule(
  rule: AutomationRule,
  context: Record<string, any>
): boolean {
  if (!rule.enabled) return false;

  // Check conditions
  if (rule.trigger.conditions && rule.trigger.conditions.length > 0) {
    return rule.trigger.conditions.every((condition) =>
      evaluateCondition(condition, context)
    );
  }

  return true;
}

/**
 * Execute a single action
 */
async function executeAction(
  action: { type: ActionType; params: Record<string, any> },
  context: Record<string, any>
): Promise<{ success: boolean; error?: string }> {
  try {
    // Simulate action execution
    console.log(`Executing action: ${action.type}`, action.params);

    // In production, implement actual action handlers
    switch (action.type) {
      case 'send_email':
        // await sendEmail(action.params);
        break;
      case 'send_sms':
        // await sendSMS(action.params);
        break;
      case 'adjust_price':
        // await adjustPricing(action.params);
        break;
      case 'create_task':
        // await createTask(action.params);
        break;
      case 'notify_staff':
        // await notifyStaff(action.params);
        break;
      case 'send_webhook':
        // await sendWebhook(action.params);
        break;
      case 'update_status':
        // await updateStatus(action.params);
        break;
      case 'generate_report':
        // await generateReport(action.params);
        break;
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Execute automation rule
 */
export async function executeRule(
  rule: AutomationRule,
  context: Record<string, any>
): Promise<AutomationExecution> {
  const execution: AutomationExecution = {
    id: uuid(),
    ruleId: rule.id,
    ruleName: rule.name,
    triggeredAt: new Date(),
    status: 'running',
    actions: rule.actions.map((action) => ({
      type: action.type,
      status: 'pending',
    })),
    context,
  };

  try {
    // Execute actions sequentially
    for (let i = 0; i < rule.actions.length; i++) {
      const action = rule.actions[i];

      // Apply delay if specified
      if (action.delay && action.delay > 0) {
        await new Promise((resolve) =>
          setTimeout(resolve, action.delay * 60 * 1000)
        );
      }

      const result = await executeAction(action, context);
      execution.actions[i].executedAt = new Date();

      if (result.success) {
        execution.actions[i].status = 'completed';
      } else {
        execution.actions[i].status = 'failed';
        execution.actions[i].error = result.error;
      }
    }

    execution.status = execution.actions.every((a) => a.status === 'completed')
      ? 'completed'
      : 'failed';
    execution.completedAt = new Date();
  } catch (error) {
    execution.status = 'failed';
    execution.completedAt = new Date();
  }

  return execution;
}

/**
 * Get automation statistics
 */
export function calculateAutomationStats(
  rules: AutomationRule[],
  executions: AutomationExecution[]
): AutomationStats {
  const activeRules = rules.filter((r) => r.enabled).length;
  const completedExecutions = executions.filter(
    (e) => e.status === 'completed'
  ).length;
  const successRate =
    executions.length > 0 ? completedExecutions / executions.length : 0;

  // Calculate average execution time
  const completedWithTime = executions.filter(
    (e) => e.completedAt && e.triggeredAt
  );
  const avgExecutionTime =
    completedWithTime.length > 0
      ? completedWithTime.reduce((sum, e) => {
          const duration =
            (e.completedAt!.getTime() - e.triggeredAt.getTime()) / 1000;
          return sum + duration;
        }, 0) / completedWithTime.length
      : 0;

  // Count executions per rule
  const executionCounts = new Map<string, { name: string; count: number }>();
  executions.forEach((execution) => {
    const existing = executionCounts.get(execution.ruleId);
    if (existing) {
      existing.count++;
    } else {
      executionCounts.set(execution.ruleId, {
        name: execution.ruleName,
        count: 1,
      });
    }
  });

  // Get most triggered rules
  const mostTriggered = Array.from(executionCounts.entries())
    .map(([ruleId, data]) => ({
      ruleId,
      ruleName: data.name,
      count: data.count,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return {
    totalRules: rules.length,
    activeRules,
    totalExecutions: executions.length,
    successRate,
    avgExecutionTime,
    mostTriggered,
  };
}

/**
 * Initialize automation rules
 */
export function initializeRules(): AutomationRule[] {
  return DEFAULT_RULES.map((rule) => ({
    ...rule,
    id: uuid(),
    createdAt: new Date(),
    updatedAt: new Date(),
    executionCount: 0,
  }));
}
