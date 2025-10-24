'use client';

import { useEffect, useState } from 'react';

interface LocationData {
  device: string;
  mac: string;
  ip: string;
  zone: string;
  area: string;
  apName: string;
  signal: number;
  timestamp: string;
}

interface AccessPoint {
  name: string;
  ip: string;
  model: string;
  clients: number;
  status: 'online' | 'offline';
}

export default function LocationTrackerPage() {
  const [location, setLocation] = useState<LocationData | null>(null);
  const [aps, setAps] = useState<AccessPoint[]>([]);
  const [history, setHistory] = useState<LocationData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Fetch location data every 3 seconds
    const fetchData = async () => {
      try {
        const response = await fetch('/api/location');
        if (!response.ok) throw new Error('Failed to fetch location');

        const data = await response.json();

        setLocation(data.location);
        setAps(data.aps);

        // Add to history if zone changed
        if (location && data.location.zone !== location.zone) {
          setHistory(prev => [data.location, ...prev].slice(0, 10));
        }

        setLoading(false);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 3000);

    return () => clearInterval(interval);
  }, [location]);

  const getSignalQuality = (signal: number): { label: string; color: string; stars: number } => {
    if (signal >= -50) return { label: 'Excellent', color: 'bg-green-500', stars: 5 };
    if (signal >= -60) return { label: 'Good', color: 'bg-blue-500', stars: 4 };
    if (signal >= -70) return { label: 'Fair', color: 'bg-yellow-500', stars: 3 };
    return { label: 'Weak', color: 'bg-red-500', stars: 2 };
  };

  const getZoneEmoji = (zone: string): string => {
    const map: Record<string, string> = {
      'room': '🛏️',
      'office': '💼',
      'lobby': '🏨',
      'restaurant': '🍽️',
      'spa': '💆',
      'unknown': '❓'
    };
    return map[zone] || '📍';
  };

  const getServices = (zone: string): string[] => {
    const services: Record<string, string[]> = {
      'room': ['🛏️ Room Service', '🌡️ Climate Control', '🧹 Housekeeping', '📺 Entertainment'],
      'office': ['💼 Business Services', '📞 Meeting Rooms', '☕ Refreshments', '🖨️ Print Queue'],
      'lobby': ['🔑 Check-In/Out', '🚕 Transportation', '🗺️ Local Guide', '🎫 Concierge'],
      'restaurant': ['🍽️ Order Food', '📋 View Menu', '💳 Request Bill', '👨‍🍳 Call Waiter'],
      'spa': ['💆 Book Treatment', '🧖 Pool & Sauna', '🍹 Poolside Service', '📅 Schedule'],
      'unknown': ['🏨 Property Guide', '📱 Mobile Key', '🔔 Notifications', '❓ Help']
    };
    return services[zone] || services['unknown'];
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-lg text-gray-700">Connecting to UniFi...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-xl max-w-md">
          <h2 className="text-2xl font-bold text-red-600 mb-4">❌ Connection Error</h2>
          <p className="text-gray-700">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!location) return null;

  const signalQuality = getSignalQuality(location.signal);
  const services = getServices(location.zone);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-xl p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">🏨 Location Tracker</h1>
              <p className="text-gray-600">Real-time WiFi location monitoring</p>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500">Last Update</div>
              <div className="text-lg font-semibold text-gray-800">
                {new Date(location.timestamp).toLocaleTimeString()}
              </div>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Current Location Card */}
          <div className="bg-white rounded-lg shadow-xl p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">📍 Current Location</h2>

            <div className="space-y-4">
              {/* Device Info */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-sm text-gray-500">Device</div>
                <div className="text-lg font-semibold text-gray-800">{location.device}</div>
                <div className="text-sm text-gray-600">{location.mac}</div>
              </div>

              {/* Zone */}
              <div className="bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg p-6 text-white">
                <div className="text-6xl mb-2 text-center">{getZoneEmoji(location.zone)}</div>
                <div className="text-2xl font-bold text-center capitalize">
                  {location.zone}
                </div>
                <div className="text-center text-indigo-100 mt-2">
                  {location.area}
                </div>
              </div>

              {/* Access Point */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-sm text-gray-500">Connected to</div>
                <div className="text-lg font-semibold text-gray-800">📡 {location.apName}</div>
              </div>

              {/* Signal Strength */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-500">Signal Strength</span>
                  <span className={`px-3 py-1 rounded-full text-white text-sm font-semibold ${signalQuality.color}`}>
                    {signalQuality.label}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-gray-200 rounded-full h-4">
                    <div
                      className={`h-4 rounded-full ${signalQuality.color}`}
                      style={{ width: `${Math.min(100, Math.max(0, (100 + location.signal) * 1.25))}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-mono text-gray-700">{location.signal} dBm</span>
                </div>
                <div className="mt-2 text-center">
                  {'⭐'.repeat(signalQuality.stars)}
                </div>
              </div>
            </div>
          </div>

          {/* Services Card */}
          <div className="bg-white rounded-lg shadow-xl p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">🎯 Available Services</h2>

            <div className="space-y-3">
              {services.map((service, index) => (
                <div
                  key={index}
                  className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                >
                  <div className="text-lg font-semibold text-gray-800">{service}</div>
                </div>
              ))}
            </div>

            <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                💡 <strong>Tip:</strong> Services change based on your location. Walk to different areas to see more options!
              </p>
            </div>
          </div>
        </div>

        {/* Access Points Grid */}
        <div className="bg-white rounded-lg shadow-xl p-6 mt-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">📡 Access Points</h2>

          <div className="grid md:grid-cols-3 gap-4">
            {aps.map((ap, index) => (
              <div
                key={index}
                className={`rounded-lg p-4 ${
                  ap.name === location.apName
                    ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-500'
                    : 'bg-gray-50'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="font-semibold text-gray-800">{ap.name}</div>
                  {ap.name === location.apName && (
                    <span className="px-2 py-1 bg-green-500 text-white text-xs rounded-full">
                      Connected
                    </span>
                  )}
                </div>
                <div className="text-sm text-gray-600 space-y-1">
                  <div>Model: {ap.model}</div>
                  <div>IP: {ap.ip}</div>
                  <div>Clients: {ap.clients}</div>
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${ap.status === 'online' ? 'bg-green-500' : 'bg-red-500'}`}></span>
                    <span className="capitalize">{ap.status}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Location History */}
        {history.length > 0 && (
          <div className="bg-white rounded-lg shadow-xl p-6 mt-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">📜 Location History</h2>

            <div className="space-y-2">
              {history.map((loc, index) => (
                <div key={index} className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{getZoneEmoji(loc.zone)}</span>
                    <div>
                      <div className="font-semibold text-gray-800 capitalize">{loc.zone}</div>
                      <div className="text-sm text-gray-600">{loc.area}</div>
                    </div>
                  </div>
                  <div className="text-sm text-gray-500">
                    {new Date(loc.timestamp).toLocaleTimeString()}
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
