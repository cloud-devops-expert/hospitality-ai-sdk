/**
 * Automation Engine Types
 * Rule-based workflows and triggers
 */

export type TriggerType =
  | 'occupancy_threshold'
  | 'no_show_detected'
  | 'vip_booking'
  | 'negative_review'
  | 'maintenance_required'
  | 'low_inventory'
  | 'time_based'
  | 'price_change'
  | 'booking_created';

export type ActionType =
  | 'send_email'
  | 'send_sms'
  | 'adjust_price'
  | 'create_task'
  | 'notify_staff'
  | 'send_webhook'
  | 'update_status'
  | 'generate_report';

export type ConditionOperator =
  | 'equals'
  | 'not_equals'
  | 'greater_than'
  | 'less_than'
  | 'contains'
  | 'not_contains';

export interface Condition {
  field: string;
  operator: ConditionOperator;
  value: any;
}

export interface Trigger {
  type: TriggerType;
  conditions?: Condition[];
  schedule?: string; // Cron expression for time-based triggers
}

export interface Action {
  type: ActionType;
  params: Record<string, any>;
  delay?: number; // Delay in minutes before executing
}

export interface AutomationRule {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  trigger: Trigger;
  actions: Action[];
  createdAt: Date;
  updatedAt: Date;
  lastExecuted?: Date;
  executionCount: number;
}

export interface AutomationExecution {
  id: string;
  ruleId: string;
  ruleName: string;
  triggeredAt: Date;
  completedAt?: Date;
  status: 'pending' | 'running' | 'completed' | 'failed';
  actions: Array<{
    type: ActionType;
    status: 'pending' | 'completed' | 'failed';
    executedAt?: Date;
    error?: string;
  }>;
  context: Record<string, any>;
}

export interface AutomationStats {
  totalRules: number;
  activeRules: number;
  totalExecutions: number;
  successRate: number;
  avgExecutionTime: number;
  mostTriggered: Array<{
    ruleId: string;
    ruleName: string;
    count: number;
  }>;
}
