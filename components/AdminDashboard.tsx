import React from 'react';
import { Station, SlotStatus, BatteryType } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend } from 'recharts';

interface AdminDashboardProps {
  station: Station;
  onLogout: () => void;
}

const mockData = [
  { name: 'Mon', swaps: 40, energy: 2400 },
  { name: 'Tue', swaps: 30, energy: 1398 },
  { name: 'Wed', swaps: 20, energy: 9800 },
  { name: 'Thu', swaps: 27, energy: 3908 },
  { name: 'Fri', swaps: 18, energy: 4800 },
  { name: 'Sat', swaps: 23, energy: 3800 },
  { name: 'Sun', swaps: 34, energy: 4300 },
];

const AdminDashboard: React.FC<AdminDashboardProps> = ({ station, onLogout }) => {
  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <header className="flex justify-between items-center mb-8 border-b border-gray-800 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-emerald-400">Admin Command Center</h1>
          <p className="text-gray-400 text-sm">Station ID: {station.id} | {station.location}</p>
        </div>
        <button
          onClick={onLogout}
          className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm transition-colors"
        >
          Logout
        </button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Slot Grid View */}
        <div className="lg:col-span-1 bg-gray-800 p-6 rounded-xl border border-gray-700">
          <h2 className="text-xl font-semibold mb-4">Live Slot Status</h2>
          <div className="grid grid-cols-2 gap-4">
            {station.slots.map((slot) => (
              <div
                key={slot.id}
                className={`p-4 rounded-lg border flex flex-col items-center justify-center aspect-square ${
                  slot.status === SlotStatus.EMPTY
                    ? 'border-gray-600 bg-gray-900/50'
                    : slot.status === SlotStatus.OCCUPIED_FULL
                    ? 'border-emerald-500 bg-emerald-900/20'
                    : slot.status === SlotStatus.OCCUPIED_CHARGING
                    ? 'border-blue-500 bg-blue-900/20'
                    : 'border-red-500 bg-red-900/20'
                }`}
              >
                <span className="text-2xl font-bold mb-1">Slot {slot.id}</span>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  slot.status === SlotStatus.EMPTY ? 'bg-gray-700' :
                  slot.status === SlotStatus.OCCUPIED_FULL ? 'bg-emerald-600' :
                  slot.status === SlotStatus.OCCUPIED_CHARGING ? 'bg-blue-600' : 'bg-red-600'
                }`}>
                  {slot.status === SlotStatus.EMPTY ? 'Available' :
                   slot.status === SlotStatus.OCCUPIED_FULL ? 'Ready' :
                   slot.status === SlotStatus.OCCUPIED_CHARGING ? 'Charging' : 'Maint.'}
                </span>
                {slot.battery && (
                  <div className="mt-2 text-xs text-gray-400 text-center">
                    <div>{slot.battery.chargeLevel}%</div>
                    <div className="scale-75 origin-center">{slot.battery.type}</div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Analytics */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 h-80">
            <h2 className="text-xl font-semibold mb-4">Weekly Swap Activity</h2>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={mockData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="name" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', color: '#f3f4f6' }}
                  itemStyle={{ color: '#f3f4f6' }}
                />
                <Legend />
                <Bar dataKey="swaps" fill="#10b981" name="Battery Swaps" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 h-80">
            <h2 className="text-xl font-semibold mb-4">Power Consumption (kWh)</h2>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={mockData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="name" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', color: '#f3f4f6' }}
                />
                <Legend />
                <Line type="monotone" dataKey="energy" stroke="#3b82f6" strokeWidth={2} name="Energy Used" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
