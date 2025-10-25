'use client';

import { useState, useRef, useEffect } from 'react';
import { Message } from '@/lib/assistant/types';
import { handleQuery } from '@/lib/assistant/query-handler';

export default function AssistantPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content:
        '👋 **Hi! I\'m HotelMind AI, your intelligent hotel assistant.**\n\nI can help you with:\n\n📊 **Forecasting**: "What\'s occupancy next weekend?"\n💰 **Pricing**: "Should I raise rates for Saturday?"\n🚫 **No-Shows**: "Show me high-risk bookings"\n👥 **Guests**: "Which guests are VIPs?"\n🧹 **Operations**: "Optimize housekeeping routes"\n\nWhat would you like to know?',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await handleQuery(input);
      setMessages((prev) => [...prev, response.message]);
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content:
          '❌ Sorry, I encountered an error. Please try again or rephrase your question.',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleQuickQuestion = (question: string) => {
    setInput(question);
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              🤖 HotelMind AI Assistant
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Your intelligent hotel operations partner
            </p>
          </div>
          <button className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100">
            Settings
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-4xl mx-auto space-y-6">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-3xl ${
                  message.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100'
                } rounded-lg shadow p-4`}
              >
                {/* Message content */}
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  {message.content.split('\n').map((line, i) => (
                    <p key={i} className="mb-2 last:mb-0">
                      {line}
                    </p>
                  ))}
                </div>

                {/* Visualization */}
                {message.visualization && message.visualization.type === 'chart' && (
                  <div className="mt-4 bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <div className="text-sm font-medium mb-2">
                      📊 Forecast Trend
                    </div>
                    <div className="space-y-1">
                      {(message.visualization.data as any[]).slice(0, 7).map((d: any, i: number) => (
                        <div
                          key={i}
                          className="flex items-center justify-between text-sm"
                        >
                          <span className="text-gray-600 dark:text-gray-400">
                            {d.date}
                          </span>
                          <div className="flex items-center gap-2">
                            <div className="w-32 bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                              <div
                                className="bg-blue-600 h-2 rounded-full"
                                style={{ width: `${d.occupancy}%` }}
                              />
                            </div>
                            <span className="font-medium w-12 text-right">
                              {d.occupancy}%
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Quick actions */}
                {message.actions && message.actions.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {message.actions.map((action) => (
                      <button
                        key={action.id}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                          action.primary
                            ? 'bg-blue-600 text-white hover:bg-blue-700'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-600'
                        }`}
                        onClick={() => {
                          // Handle action (to be implemented)
                          console.log('Action:', action.action, action.params);
                        }}
                      >
                        {action.icon && <span className="mr-1">{action.icon}</span>}
                        {action.label}
                      </button>
                    ))}
                  </div>
                )}

                {/* Timestamp */}
                <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                  {message.timestamp.toLocaleTimeString()}
                </div>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                  <div
                    className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: '0.1s' }}
                  />
                  <div
                    className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: '0.2s' }}
                  />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Quick Questions */}
      {messages.length <= 2 && (
        <div className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              Quick questions:
            </div>
            <div className="flex flex-wrap gap-2">
              {[
                "What's occupancy next weekend?",
                'Should I raise prices tonight?',
                'Show me high-risk no-shows',
                'Which guests are VIPs?',
              ].map((question) => (
                <button
                  key={question}
                  onClick={() => handleQuickQuestion(question)}
                  className="px-3 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg text-sm transition"
                >
                  {question}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Input */}
      <div className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
        <div className="max-w-4xl mx-auto flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask anything about your hotel..."
            className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100"
            disabled={isLoading}
          />
          <button
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition font-medium"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
