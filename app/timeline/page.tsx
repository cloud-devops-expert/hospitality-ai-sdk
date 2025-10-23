'use client';

import { useState, useEffect } from 'react';
import { TimelineEvent, TimelineEventType, TimelinePriority } from '@/lib/timeline/types';
import { generateTimeline } from '@/lib/timeline/generator';

export default function TimelinePage() {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTypes, setSelectedTypes] = useState<TimelineEventType[]>([]);
  const [selectedPriorities, setSelectedPriorities] = useState<TimelinePriority[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [dateRange, setDateRange] = useState<'today' | 'week' | 'month'>('week');

  useEffect(() => {
    loadTimeline();
  }, [selectedTypes, selectedPriorities, searchQuery, dateRange]);

  const loadTimeline = async () => {
    setLoading(true);
    try {
      const now = new Date();
      let startDate = now;
      let endDate = new Date();

      switch (dateRange) {
        case 'today':
          startDate = new Date(now.setHours(0, 0, 0, 0));
          endDate = new Date(now.setHours(23, 59, 59, 999));
          break;
        case 'week':
          startDate = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
          endDate = new Date(now.getTime() + 4 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          startDate = new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000);
          endDate = new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000);
          break;
      }

      const response = await generateTimeline({
        types: selectedTypes.length > 0 ? selectedTypes : undefined,
        priorities: selectedPriorities.length > 0 ? selectedPriorities : undefined,
        dateRange: { start: startDate, end: endDate },
        searchQuery: searchQuery || undefined,
      });
      setEvents(response.events);
    } catch (error) {
      console.error('Failed to load timeline:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleType = (type: TimelineEventType) => {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const togglePriority = (priority: TimelinePriority) => {
    setSelectedPriorities((prev) =>
      prev.includes(priority) ? prev.filter((p) => p !== priority) : [...prev, priority]
    );
  };

  const getPriorityColor = (priority: TimelinePriority) => {
    switch (priority) {
      case 'critical':
        return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300';
      case 'high':
        return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300';
      case 'medium':
        return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300';
      case 'low':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300';
    }
  };

  const getEventColor = (color?: string) => {
    const colors: Record<string, string> = {
      red: 'border-red-500 bg-red-50 dark:bg-red-900/20',
      orange: 'border-orange-500 bg-orange-50 dark:bg-orange-900/20',
      yellow: 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20',
      green: 'border-green-500 bg-green-50 dark:bg-green-900/20',
      blue: 'border-blue-500 bg-blue-50 dark:bg-blue-900/20',
      purple: 'border-purple-500 bg-purple-50 dark:bg-purple-900/20',
      teal: 'border-teal-500 bg-teal-50 dark:bg-teal-900/20',
    };
    return colors[color || 'blue'] || colors.blue;
  };

  const formatTimestamp = (date: Date) => {
    const now = new Date();
    const diff = date.getTime() - now.getTime();
    const absDiff = Math.abs(diff);
    const days = Math.floor(absDiff / (24 * 60 * 60 * 1000));
    const hours = Math.floor(absDiff / (60 * 60 * 1000));
    const minutes = Math.floor(absDiff / (60 * 1000));

    if (diff > 0) {
      // Future
      if (days > 0) return `In ${days} day${days > 1 ? 's' : ''}`;
      if (hours > 0) return `In ${hours} hour${hours > 1 ? 's' : ''}`;
      if (minutes > 0) return `In ${minutes} minute${minutes > 1 ? 's' : ''}`;
      return 'Now';
    } else {
      // Past
      if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
      if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
      if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
      return 'Just now';
    }
  };

  const groupEventsByDate = (events: TimelineEvent[]) => {
    const groups: Record<string, TimelineEvent[]> = {};
    events.forEach((event) => {
      const dateKey = event.timestamp.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
      });
      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(event);
    });
    return groups;
  };

  const eventGroups = groupEventsByDate(events);
  const eventTypes: TimelineEventType[] = [
    'checkin',
    'checkout',
    'booking',
    'vip_arrival',
    'maintenance',
    'housekeeping',
    'review',
    'alert',
  ];
  const priorities: TimelinePriority[] = ['critical', 'high', 'medium', 'low'];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading timeline...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 text-gray-900 dark:text-gray-100">
            📅 Unified Timeline
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            All hotel events in chronological order
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow mb-6 p-6">
          <div className="space-y-4">
            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Search events
              </label>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by guest, room, or description..."
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100"
              />
            </div>

            {/* Date Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Date range
              </label>
              <div className="flex gap-2">
                {(['today', 'week', 'month'] as const).map((range) => (
                  <button
                    key={range}
                    onClick={() => setDateRange(range)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                      dateRange === range
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    {range.charAt(0).toUpperCase() + range.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Event Types */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Event types
              </label>
              <div className="flex flex-wrap gap-2">
                {eventTypes.map((type) => (
                  <button
                    key={type}
                    onClick={() => toggleType(type)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                      selectedTypes.includes(type)
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    {type.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>

            {/* Priority Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Priority
              </label>
              <div className="flex flex-wrap gap-2">
                {priorities.map((priority) => (
                  <button
                    key={priority}
                    onClick={() => togglePriority(priority)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                      selectedPriorities.includes(priority)
                        ? 'bg-blue-600 text-white'
                        : `${getPriorityColor(priority)} hover:opacity-80`
                    }`}
                  >
                    {priority}
                  </button>
                ))}
              </div>
            </div>

            {/* Results count */}
            <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Showing <strong>{events.length}</strong> event{events.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
        </div>

        {/* Timeline */}
        {events.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-12 text-center">
            <p className="text-gray-600 dark:text-gray-400 text-lg">
              No events found matching your filters
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {Object.entries(eventGroups).map(([date, dateEvents]) => (
              <div key={date}>
                <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100 sticky top-0 bg-gray-50 dark:bg-gray-900 py-2 z-10">
                  {date}
                </h2>
                <div className="relative border-l-2 border-gray-300 dark:border-gray-700 ml-6 space-y-6">
                  {dateEvents.map((event) => (
                    <div key={event.id} className="relative pl-8 pb-6">
                      {/* Timeline dot */}
                      <div className="absolute left-0 top-0 -ml-[13px] w-6 h-6 rounded-full bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-700 flex items-center justify-center">
                        <span className="text-xs">{event.icon}</span>
                      </div>

                      {/* Event card */}
                      <div
                        className={`border-l-4 ${getEventColor(event.color)} rounded-r-lg p-4 shadow-sm`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                                {event.title}
                              </h3>
                              <span
                                className={`text-xs px-2 py-1 rounded-full ${getPriorityColor(event.priority)}`}
                              >
                                {event.priority}
                              </span>
                            </div>
                            <p className="text-gray-700 dark:text-gray-300 text-sm">
                              {event.description}
                            </p>
                          </div>
                          <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap ml-4">
                            {formatTimestamp(event.timestamp)}
                          </span>
                        </div>

                        {/* Metadata */}
                        {event.metadata && Object.keys(event.metadata).length > 0 && (
                          <div className="flex flex-wrap gap-2 mb-3">
                            {event.metadata.guestName && (
                              <span className="text-xs bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">
                                👤 {event.metadata.guestName}
                              </span>
                            )}
                            {event.metadata.roomNumber && (
                              <span className="text-xs bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">
                                🚪 Room {event.metadata.roomNumber}
                              </span>
                            )}
                            {event.metadata.amount && (
                              <span className="text-xs bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">
                                💰 ${event.metadata.amount.toFixed(0)}
                              </span>
                            )}
                          </div>
                        )}

                        {/* Actions */}
                        {event.actions && event.actions.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {event.actions.map((action) => (
                              <button
                                key={action.id}
                                onClick={() => console.log('Action:', action.action, action.params)}
                                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                                  action.primary
                                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                                    : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-600'
                                }`}
                              >
                                {action.icon && <span className="mr-1">{action.icon}</span>}
                                {action.label}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
