import React from 'react';
import { useStats } from '../../../hooks/useStats';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';

const COLORS = ['#3b82f6', '#10b981', '#ef4444', '#f59e0b', '#8b5cf6'];

const StatsDashboard: React.FC = () => {
  // Consolidate to a single API call. useStats returns the full StatsResponse which includes trend and breakdowns.
  const { data, loading, error, refetch } = useStats({ scope: 'all' }) as any;

  // Derived data with fallbacks prevents the "blank page" and ensures stability if partial data is returned
  const summary = data?.summary || { pending: 0, completed: 0, failed: 0, failure: 0 };
  const extra = data?.extra || { cancelled: 0, redeemed: 0, total: 0, opening: 0, inprogress: 0 };
  const trend = data?.charts?.statusTrend || [];
  const breakdowns = data?.breakdowns;

  if (loading && !data) {
    return (
      <div className="animate-fade-in p-6">
        <div className="h-8 bg-gray-800 rounded w-1/4 mb-6 animate-pulse"></div>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-gray-800 p-6 rounded-xl border border-gray-700 h-24 animate-pulse">
              <div className="h-4 bg-gray-700 rounded w-3/4 mb-2"></div>
              <div className="h-8 bg-gray-700 rounded w-1/2"></div>
            </div>
          ))}
        </div>
        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 h-64 animate-pulse"></div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Session Statistics</h2>
        <button
          onClick={() => refetch?.()}
          disabled={loading}
          className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50"
        >
          <svg 
            className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} 
            fill="none" viewBox="0 0 24 24" stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh Data
        </button>
      </div>

      {error && (
        <div className="mb-6 bg-red-900/50 border border-red-500 text-red-200 rounded-lg p-4">
          Failed to load stats: {(error as Error).message}
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
          <p className="text-gray-400 text-xs uppercase">Pending</p>
          <p className="text-3xl font-bold mt-2 text-yellow-500">{summary.pending}</p>
          <span className="text-gray-500 text-xs">Awaiting action</span>
        </div>
        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
          <p className="text-gray-400 text-xs uppercase">Completed</p>
          <p className="text-3xl font-bold mt-2 text-emerald-400">{summary.completed}</p>
          <span className="text-emerald-500 text-xs">Successful</span>
        </div>
        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
          <p className="text-gray-400 text-xs uppercase">Failed</p>
          <p className="text-3xl font-bold mt-2 text-red-400">{summary.failed}</p>
          <span className="text-red-500 text-xs">Errors</span>
        </div>
        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
          <p className="text-gray-400 text-xs uppercase">Cancelled</p>
          <p className="text-3xl font-bold mt-2 text-gray-400">{extra.cancelled}</p>
          <span className="text-gray-500 text-xs">Aborted</span>
        </div>
        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
          <p className="text-gray-400 text-xs uppercase">Redeemed</p>
          <p className="text-3xl font-bold mt-2 text-purple-400">{extra.redeemed}</p>
          <span className="text-purple-500 text-xs">Completed swaps</span>
        </div>
      </div>

      {/* Extra Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
          <p className="text-gray-400 text-xs uppercase">Total Sessions</p>
          <p className="text-2xl font-bold mt-2">{extra.total}</p>
        </div>
        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
          <p className="text-gray-400 text-xs uppercase">Opening</p>
          <p className="text-2xl font-bold mt-2 text-blue-400">{extra.opening}</p>
        </div>
        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
          <p className="text-gray-400 text-xs uppercase">In Progress</p>
          <p className="text-2xl font-bold mt-2 text-blue-400">{extra.inprogress}</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-6">
        {/* Status Trend - 2 columns wide */}
        <div className="xl:col-span-2">
          <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
            <h3 className="text-lg font-bold mb-4">Status Trend (Daily)</h3>
            {trend && trend.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={trend} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis 
                    dataKey="date" 
                    stroke="#9ca3af"
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis stroke="#9ca3af" tick={{ fontSize: 12 }} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: "#1f2937", borderColor: "#374151" }}
                    labelStyle={{ color: "#e5e7eb" }}
                  />
                  <Legend />
                  <Bar dataKey="pending" name="Pending" stackId="status" fill="#f59e0b" />
                  <Bar dataKey="completed" name="Completed" stackId="status" fill="#10b981" />
                  <Bar dataKey="failed" name="Failed" stackId="status" fill="#ef4444" />
                  <Bar dataKey="total" name="Total" stackId="status" fill="#3b82f6" opacity={0.6} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[250px] text-gray-500">
                <p>No trend data available.</p>
              </div>
            )}
          </div>
        </div>

        {/* Breakdown by Status */}
        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
          <h3 className="text-lg font-bold mb-4">Breakdown by Status</h3>
          {breakdowns?.byStatus && (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={[
                    { name: 'Pending', value: breakdowns.byStatus.pending },
                    { name: 'Completed', value: breakdowns.byStatus.completed },
                    { name: 'Failed', value: breakdowns.byStatus.failed },
                    { name: 'Cancelled', value: breakdowns.byStatus.cancelled },
                  ]}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {COLORS.map((color, index) => (
                    <Cell key={`cell-${index}`} fill={color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: "#1f2937", borderColor: "#374151" }}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Breakdown by Session Type */}
      <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
        <h3 className="text-lg font-bold mb-4">Breakdown by Session Type</h3>
        {breakdowns?.bySessionType && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-900/50 p-4 rounded-lg">
              <p className="text-gray-400 text-sm">Deposit Sessions</p>
              <p className="text-2xl font-bold mt-1 text-emerald-400">
                {breakdowns.bySessionType.deposit}
              </p>
            </div>
            <div className="bg-gray-900/50 p-4 rounded-lg">
              <p className="text-gray-400 text-sm">Withdrawal Sessions</p>
              <p className="text-2xl font-bold mt-1 text-blue-400">
                {breakdowns.bySessionType.withdrawal}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StatsDashboard;
