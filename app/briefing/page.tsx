'use client';

import { useState, useEffect } from 'react';
import { DailyBriefing, BriefingAlert } from '@/lib/briefing/types';
import { generateDailyBriefing } from '@/lib/briefing/generator';

export default function BriefingPage() {
  const [briefing, setBriefing] = useState<DailyBriefing | null>(null);
  const [loading, setLoading] = useState(true);
  const [completedAlerts, setCompletedAlerts] = useState<Set<string>>(
    new Set()
  );

  useEffect(() => {
    loadBriefing();
  }, []);

  const loadBriefing = async () => {
    setLoading(true);
    try {
      const data = await generateDailyBriefing();
      setBriefing(data);
    } catch (error) {
      console.error('Failed to load briefing:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAlertAction = (alert: BriefingAlert, actionId: string) => {
    console.log('Action:', actionId, 'for alert:', alert.id);

    // Mark as completed if it's a primary action
    const action = alert.actions.find((a) => a.id === actionId);
    if (action?.primary || actionId.includes('done')) {
      setCompletedAlerts((prev) => new Set([...prev, alert.id]));
    }
  };

  const getPriorityIcon = (type: BriefingAlert['type']) => {
    switch (type) {
      case 'critical':
        return '🔴';
      case 'important':
        return '🟡';
      case 'fyi':
        return '🔵';
    }
  };

  const getPriorityColor = (type: BriefingAlert['type']) => {
    switch (type) {
      case 'critical':
        return 'border-red-500 bg-red-50 dark:bg-red-900/20';
      case 'important':
        return 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20';
      case 'fyi':
        return 'border-blue-500 bg-blue-50 dark:bg-blue-900/20';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">
            Generating your daily briefing...
          </p>
        </div>
      </div>
    );
  }

  if (!briefing) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <p className="text-gray-600 dark:text-gray-400">
          Failed to load briefing
        </p>
      </div>
    );
  }

  const pendingAlerts = briefing.alerts.filter(
    (a) => !completedAlerts.has(a.id)
  );
  const criticalAlerts = pendingAlerts.filter((a) => a.type === 'critical');

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 text-gray-900 dark:text-gray-100">
            {briefing.greeting}
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Today at Your Hotel •{' '}
            {briefing.date.toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </div>

        {/* Priority Actions */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow mb-6 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
              ⚡ Priority Actions ({criticalAlerts.length})
            </h2>
            <button
              onClick={loadBriefing}
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              🔄 Refresh
            </button>
          </div>

          {criticalAlerts.length === 0 ? (
            <p className="text-gray-600 dark:text-gray-400 py-8 text-center">
              ✅ No urgent actions needed - great job!
            </p>
          ) : (
            <div className="space-y-4">
              {criticalAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`border-l-4 ${getPriorityColor(alert.type)} rounded-r-lg p-4`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span>{getPriorityIcon(alert.type)}</span>
                        <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                          {alert.title}
                        </h3>
                      </div>
                      <p className="text-gray-700 dark:text-gray-300 mb-2">
                        {alert.description}
                      </p>
                      {alert.impact && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 italic">
                          {alert.impact}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-4">
                    {alert.actions.map((action) => (
                      <button
                        key={action.id}
                        onClick={() => handleAlertAction(alert, action.id)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                          action.primary
                            ? 'bg-blue-600 text-white hover:bg-blue-700'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-600'
                        }`}
                      >
                        {action.icon && (
                          <span className="mr-1">{action.icon}</span>
                        )}
                        {action.label}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Today's Overview */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow mb-6 p-6">
          <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-gray-100">
            📊 Today's Overview
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                Arrivals
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {briefing.summary.arrivals}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {briefing.summary.vipGuests} VIPs
              </div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                Departures
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {briefing.summary.departures}
              </div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                Occupancy
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {Math.round(briefing.summary.occupancy)}%
              </div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                Revenue
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                ${briefing.summary.revenue.toLocaleString()}
              </div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                VIP Guests
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {briefing.summary.vipGuests}
              </div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                No-Show Risk
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {briefing.summary.highRiskNoShows}
              </div>
            </div>
          </div>
        </div>

        {/* Key Insights */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow mb-6 p-6">
          <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-gray-100">
            💡 Key Insights
          </h2>
          <div className="space-y-2">
            {briefing.insights.map((insight, i) => (
              <p
                key={i}
                className="text-gray-700 dark:text-gray-300 flex items-start"
              >
                <span className="mr-2">•</span>
                <span>{insight}</span>
              </p>
            ))}
          </div>
        </div>

        {/* All Alerts */}
        {pendingAlerts.filter((a) => a.type !== 'critical').length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-gray-100">
              📋 Other Alerts (
              {pendingAlerts.filter((a) => a.type !== 'critical').length})
            </h2>
            <div className="space-y-4">
              {pendingAlerts
                .filter((a) => a.type !== 'critical')
                .map((alert) => (
                  <div
                    key={alert.id}
                    className={`border-l-4 ${getPriorityColor(alert.type)} rounded-r-lg p-4`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span>{getPriorityIcon(alert.type)}</span>
                      <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                        {alert.title}
                      </h3>
                    </div>
                    <p className="text-gray-700 dark:text-gray-300 mb-3">
                      {alert.description}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {alert.actions.map((action) => (
                        <button
                          key={action.id}
                          onClick={() => handleAlertAction(alert, action.id)}
                          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                            action.primary
                              ? 'bg-blue-600 text-white hover:bg-blue-700'
                              : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-600'
                          }`}
                        >
                          {action.icon && (
                            <span className="mr-1">{action.icon}</span>
                          )}
                          {action.label}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
