'use client';

import { useState, useEffect } from 'react';
import { v4 as uuid } from 'uuid';
import {
  AutomationRule,
  AutomationExecution,
  AutomationStats,
} from '@/lib/automation/types';
import {
  initializeRules,
  executeRule,
  shouldExecuteRule,
  calculateAutomationStats,
} from '@/lib/automation/engine';

export default function AutomationPage() {
  const [rules, setRules] = useState<AutomationRule[]>([]);
  const [executions, setExecutions] = useState<AutomationExecution[]>([]);
  const [stats, setStats] = useState<AutomationStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedRule, setSelectedRule] = useState<AutomationRule | null>(null);
  const [viewMode, setViewMode] = useState<'rules' | 'executions' | 'stats'>('rules');

  useEffect(() => {
    loadAutomation();
  }, []);

  const loadAutomation = () => {
    setLoading(true);

    // Initialize rules
    const initialRules = initializeRules();

    // Generate synthetic execution history
    const syntheticExecutions: AutomationExecution[] = [];
    for (let i = 0; i < 50; i++) {
      const rule = initialRules[Math.floor(Math.random() * initialRules.length)];
      const triggeredAt = new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000);
      const completedAt = new Date(triggeredAt.getTime() + Math.random() * 5 * 60 * 1000);

      syntheticExecutions.push({
        id: uuid(),
        ruleId: rule.id,
        ruleName: rule.name,
        triggeredAt,
        completedAt,
        status: Math.random() > 0.1 ? 'completed' : 'failed',
        actions: rule.actions.map((action) => ({
          type: action.type,
          status: Math.random() > 0.1 ? 'completed' : 'failed',
          executedAt: new Date(triggeredAt.getTime() + Math.random() * 3 * 60 * 1000),
        })),
        context: {},
      });
    }

    setRules(initialRules);
    setExecutions(syntheticExecutions);
    setStats(calculateAutomationStats(initialRules, syntheticExecutions));
    setLoading(false);
  };

  const toggleRule = (ruleId: string) => {
    setRules((prev) =>
      prev.map((rule) =>
        rule.id === ruleId
          ? { ...rule, enabled: !rule.enabled, updatedAt: new Date() }
          : rule
      )
    );
  };

  const testRule = async (rule: AutomationRule) => {
    // Simulate test execution
    const testContext = {
      occupancy: 90,
      probability: 0.85,
      rating: 2,
      priority: 'urgent',
    };

    const canExecute = shouldExecuteRule(rule, testContext);
    if (canExecute) {
      const execution = await executeRule(rule, testContext);
      setExecutions((prev) => [execution, ...prev]);
      alert(`Rule tested successfully! Status: ${execution.status}`);
    } else {
      alert('Rule conditions not met with test data');
    }
  };

  const getStatusColor = (status: AutomationExecution['status']) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300';
      case 'failed':
        return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300';
      case 'running':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300';
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const getTriggerIcon = (type: string) => {
    const icons: Record<string, string> = {
      occupancy_threshold: '📊',
      no_show_detected: '⚠️',
      vip_booking: '⭐',
      negative_review: '😞',
      maintenance_required: '🔧',
      time_based: '⏰',
      price_change: '💰',
      booking_created: '📅',
    };
    return icons[type] || '🔔';
  };

  const getActionIcon = (type: string) => {
    const icons: Record<string, string> = {
      send_email: '📧',
      send_sms: '📱',
      adjust_price: '💰',
      create_task: '📋',
      notify_staff: '👥',
      send_webhook: '🔗',
      update_status: '🔄',
      generate_report: '📊',
    };
    return icons[type] || '⚡';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">
            Loading automation engine...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 text-gray-900 dark:text-gray-100">
            ⚡ Automation Engine
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Rule-based workflows and intelligent automation
          </p>
        </div>

        {/* Stats Overview */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                Total Rules
              </div>
              <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                {stats.totalRules}
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                Active
              </div>
              <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                {stats.activeRules}
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                Executions
              </div>
              <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                {stats.totalExecutions}
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                Success Rate
              </div>
              <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                {Math.round(stats.successRate * 100)}%
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                Avg Time
              </div>
              <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                {stats.avgExecutionTime.toFixed(1)}s
              </div>
            </div>
          </div>
        )}

        {/* View Mode Tabs */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
          <div className="flex flex-wrap gap-2">
            {(['rules', 'executions', 'stats'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  viewMode === mode
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {mode.charAt(0).toUpperCase() + mode.slice(1)}
              </button>
            ))}
            <button
              onClick={loadAutomation}
              className="ml-auto px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg text-sm font-medium transition"
            >
              🔄 Refresh
            </button>
          </div>
        </div>

        {/* Rules View */}
        {viewMode === 'rules' && (
          <div className="space-y-4">
            {rules.map((rule) => (
              <div
                key={rule.id}
                className="bg-white dark:bg-gray-800 rounded-lg shadow p-6"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                        {rule.name}
                      </h3>
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${
                          rule.enabled
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                            : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                        }`}
                      >
                        {rule.enabled ? 'Active' : 'Disabled'}
                      </span>
                    </div>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                      {rule.description}
                    </p>

                    <div className="space-y-3">
                      {/* Trigger */}
                      <div>
                        <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Trigger
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-xl">
                            {getTriggerIcon(rule.trigger.type)}
                          </span>
                          <span className="text-gray-700 dark:text-gray-300">
                            {rule.trigger.type.replace('_', ' ')}
                          </span>
                          {rule.trigger.conditions && rule.trigger.conditions.length > 0 && (
                            <span className="text-gray-500 dark:text-gray-400">
                              ({rule.trigger.conditions.length} condition
                              {rule.trigger.conditions.length > 1 ? 's' : ''})
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div>
                        <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Actions ({rule.actions.length})
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {rule.actions.map((action, i) => (
                            <div
                              key={i}
                              className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg text-sm"
                            >
                              <span>{getActionIcon(action.type)}</span>
                              <span>{action.type.replace('_', ' ')}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Stats */}
                      <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400 pt-2">
                        <span>
                          Executed: {rule.executionCount || 0} times
                        </span>
                        {rule.lastExecuted && (
                          <span>
                            Last: {rule.lastExecuted.toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2 ml-4">
                    <button
                      onClick={() => toggleRule(rule.id)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                        rule.enabled
                          ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-600'
                          : 'bg-green-600 text-white hover:bg-green-700'
                      }`}
                    >
                      {rule.enabled ? 'Disable' : 'Enable'}
                    </button>
                    <button
                      onClick={() => testRule(rule)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition"
                    >
                      Test
                    </button>
                    <button
                      onClick={() => setSelectedRule(rule)}
                      className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg text-sm font-medium transition"
                    >
                      Details
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Executions View */}
        {viewMode === 'executions' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Rule
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Triggered At
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Actions
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Duration
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {executions.slice(0, 50).map((execution) => {
                    const duration = execution.completedAt
                      ? (execution.completedAt.getTime() -
                          execution.triggeredAt.getTime()) /
                        1000
                      : 0;

                    return (
                      <tr
                        key={execution.id}
                        className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition"
                      >
                        <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-gray-100">
                          {execution.ruleName}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                          {execution.triggeredAt.toLocaleString()}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(execution.status)}`}
                          >
                            {execution.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                          {execution.actions.filter((a) => a.status === 'completed').length}/
                          {execution.actions.length}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                          {duration.toFixed(1)}s
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Stats View */}
        {viewMode === 'stats' && stats && (
          <div className="space-y-6">
            {/* Most Triggered Rules */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-gray-100">
                Most Triggered Rules
              </h2>
              <div className="space-y-3">
                {stats.mostTriggered.map((item, i) => (
                  <div
                    key={item.ruleId}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-bold text-gray-500 dark:text-gray-400 w-6">
                        #{i + 1}
                      </span>
                      <span className="text-gray-900 dark:text-gray-100">
                        {item.ruleName}
                      </span>
                    </div>
                    <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                      {item.count}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Performance Metrics */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-gray-100">
                Performance Metrics
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                    Success Rate
                  </div>
                  <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                    {Math.round(stats.successRate * 100)}%
                  </div>
                </div>
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                    Average Execution Time
                  </div>
                  <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                    {stats.avgExecutionTime.toFixed(1)}s
                  </div>
                </div>
                <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                    Total Executions
                  </div>
                  <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                    {stats.totalExecutions}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Rule Details Modal */}
        {selectedRule && (
          <div
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
            onClick={() => setSelectedRule(null)}
          >
            <div
              className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                    {selectedRule.name}
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400">
                    {selectedRule.description}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedRule(null)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-2xl"
                >
                  ✕
                </button>
              </div>

              {/* Trigger Details */}
              <div className="mb-6">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">
                  Trigger
                </h3>
                <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl">{getTriggerIcon(selectedRule.trigger.type)}</span>
                    <span className="text-gray-900 dark:text-gray-100 font-medium">
                      {selectedRule.trigger.type.replace('_', ' ')}
                    </span>
                  </div>
                  {selectedRule.trigger.conditions && selectedRule.trigger.conditions.length > 0 && (
                    <div className="mt-3 space-y-2">
                      <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Conditions:
                      </div>
                      {selectedRule.trigger.conditions.map((condition, i) => (
                        <div
                          key={i}
                          className="text-sm text-gray-600 dark:text-gray-400 ml-4"
                        >
                          • {condition.field} {condition.operator} {String(condition.value)}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Actions Details */}
              <div className="mb-6">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">
                  Actions ({selectedRule.actions.length})
                </h3>
                <div className="space-y-3">
                  {selectedRule.actions.map((action, i) => (
                    <div
                      key={i}
                      className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xl">{getActionIcon(action.type)}</span>
                        <span className="text-gray-900 dark:text-gray-100 font-medium">
                          {action.type.replace('_', ' ')}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400 ml-7">
                        {Object.entries(action.params).map(([key, value]) => (
                          <div key={key}>
                            {key}: {String(value)}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={() => setSelectedRule(null)}
                className="w-full px-6 py-3 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
