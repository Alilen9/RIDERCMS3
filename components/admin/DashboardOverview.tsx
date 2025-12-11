import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { DashboardSummary } from '../../services/adminService';

interface DashboardOverviewProps {
  summaryData: DashboardSummary | null;
}

const DashboardOverview: React.FC<DashboardOverviewProps> = ({ summaryData }) => {
  return (
    <div className="space-y-6 animate-fade-in">
      <h2 className="text-2xl font-bold">System Overview</h2>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 animate-fade-in">
          <p className="text-gray-400 text-xs uppercase">Total Revenue (Monthly)</p>
          <p className="text-3xl font-bold mt-2">KES {summaryData?.totalRevenue.toLocaleString() || '...'}</p>
          <span className="text-gray-500 text-xs">Current Month</span>
        </div>
        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 animate-fade-in" style={{ animationDelay: '50ms' }}>
          <p className="text-gray-400 text-xs uppercase">Active Stations</p>
          <p className="text-3xl font-bold mt-2">{summaryData?.activeStations ?? '...'}</p>
          <span className="text-blue-500 text-xs">100% Uptime</span>
        </div>
        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 animate-fade-in" style={{ animationDelay: '100ms' }}>
          <p className="text-gray-400 text-xs uppercase">Total Swaps</p>
          <p className="text-3xl font-bold mt-2">{summaryData?.totalSwaps.toLocaleString() || '...'}</p>
          <span className="text-emerald-500 text-xs">↑ 124 this week</span>
        </div>
        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 animate-fade-in" style={{ animationDelay: '150ms' }}>
          <p className="text-gray-400 text-xs uppercase">Active Sessions</p>
          <p className="text-3xl font-bold mt-2 text-yellow-500">{summaryData?.activeSessions ?? '...'}</p>
          <span className="text-gray-500 text-xs">Currently Charging</span>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-80">
        <div className="lg:col-span-2 bg-gray-800 p-6 rounded-xl border border-gray-700">
          <h3 className="text-lg font-bold mb-4">Swap Volume Trend</h3>
          {summaryData && summaryData.swapVolumeTrend.length > 1 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={summaryData.swapVolumeTrend}>
                <defs>
                  <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="name" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <Tooltip contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151' }} />
                <Area type="monotone" dataKey="val" stroke="#10b981" fillOpacity={1} fill="url(#colorVal)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              <p>Not enough data to display trend.</p>
            </div>
          )}
        </div>
        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
          <h3 className="text-lg font-bold mb-4">Battery Usage</h3>
          {summaryData && summaryData.batteryUsage.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={summaryData.batteryUsage}
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  <Cell fill="#10b981" />
                  <Cell fill="#3b82f6" />
                  <Cell fill="#8b5cf6" />
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151' }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              <p>No battery usage data available.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardOverview;