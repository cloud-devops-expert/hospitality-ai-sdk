'use client';

import { useState } from 'react';

// Simplified three-view demo for Entity Extraction (NER)
// ROI: $450/month from automated data entry
// Technology: spaCy NER (en_core_web_sm)

export default function EntityExtractionDemo() {
  const [activeView, setActiveView] = useState('extract');

  const SAMPLE_EXTRACTIONS = [
    {
      id: '1',
      text: 'Guest John Smith in room 305 called about reservation RES-12345. Contact: john.smith@email.com or 555-0123.',
      entities: { people: ['John Smith'], rooms: ['305'], ids: ['RES-12345'], emails: ['john.smith@email.com'], phones: ['555-0123'] },
      timestamp: '5 min ago',
    },
    {
      id: '2',
      text: 'Mary Johnson checked out from suite 1501 on January 15th. Total: $1,250.50. Ref: CONF-98765',
      entities: { people: ['Mary Johnson'], rooms: ['1501'], dates: ['January 15th'], money: ['$1,250.50'], ids: ['CONF-98765'] },
      timestamp: '18 min ago',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Entity Extraction (NER)
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Auto-extract names, dates, rooms, contact info using spaCy
              </p>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-600 dark:text-gray-400">Monthly ROI</div>
              <div className="text-3xl font-bold text-green-600 dark:text-green-400">$450</div>
              <div className="text-xs text-gray-500">$5,400/year</div>
            </div>
          </div>
          <div className="grid grid-cols-4 gap-4 mt-4">
            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg text-green-600 dark:text-green-400">
              <div className="text-2xl font-bold">85%</div>
              <div className="text-sm opacity-80">Accuracy</div>
            </div>
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg text-blue-600 dark:text-blue-400">
              <div className="text-2xl font-bold">&lt;10ms</div>
              <div className="text-sm opacity-80">Processing</div>
            </div>
            <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg text-purple-600 dark:text-purple-400">
              <div className="text-2xl font-bold">80%</div>
              <div className="text-sm opacity-80">Time Saved</div>
            </div>
            <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg text-orange-600 dark:text-orange-400">
              <div className="text-2xl font-bold">$0</div>
              <div className="text-sm opacity-80">API Cost</div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Recent Extractions</h2>
          <div className="space-y-4">
            {SAMPLE_EXTRACTIONS.map(item => (
              <div key={item.id} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">{item.timestamp}</div>
                <div className="text-sm mb-3 text-gray-700 dark:text-gray-300">{item.text}</div>
                <div className="grid grid-cols-5 gap-2 text-xs">
                  {item.entities.people && <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded">👤 {item.entities.people.join(', ')}</div>}
                  {item.entities.rooms && <div className="bg-green-100 dark:bg-green-900/30 p-2 rounded">🏠 Room {item.entities.rooms.join(', ')}</div>}
                  {item.entities.emails && <div className="bg-purple-100 dark:bg-purple-900/30 p-2 rounded">📧 {item.entities.emails.join(', ')}</div>}
                  {item.entities.phones && <div className="bg-orange-100 dark:bg-orange-900/30 p-2 rounded">📱 {item.entities.phones.join(', ')}</div>}
                  {item.entities.ids && <div className="bg-yellow-100 dark:bg-yellow-900/30 p-2 rounded">🎫 {item.entities.ids.join(', ')}</div>}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg p-6 mt-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">🔧 Technology: spaCy NER</h2>
          <p className="text-sm text-gray-700 dark:text-gray-300">en_core_web_sm model • 85% accuracy • &lt;10ms CPU • $0 API cost • 1,200 extractions/month • 1.4 hr/day saved</p>
        </div>
      </div>
    </div>
  );
}
