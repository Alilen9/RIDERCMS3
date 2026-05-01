import React from 'react';
import { PieChart, Pie, Cell, Bar, ResponsiveContainer, Tooltip, BarChart, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';
import { StatsResponse, BreakdownByStatus, BreakdownBySessionType, DashboardSummary, DailyTrend } from '../../types';
import SwapVolumeTrend from './dashboard/SwapVolumeTrend';
import SwapSuccessRate from './dashboard/SwapSuccessRate';
import RecentSwapActivity from './dashboard/RecentSwapActivity';

interface DashboardOverviewProps {
  summaryData: DashboardSummary | null;
  statsData?: StatsResponse | null;
  statusTrend?: DailyTrend[] | null;
  breakdowns?: {
    byStatus?: BreakdownByStatus;
    bySessionType?: BreakdownBySessionType;
  } | null;
}

const DashboardOverview: React.FC<DashboardOverviewProps> = ({ summaryData, statsData, statusTrend, breakdowns }) => {
  // Ensure summaryData has fallback values - Moved to top to fix "used before declaration"
  const safeSummaryData = summaryData || {
    totalRevenue: 0,
    activeStations: 0,
    totalSwaps: 0,
    activeSessions: 0,
    swapVolumeTrend: [],
    batteryUsage: [],
  };

  // Use stats data if available, otherwise fall back to mock data
  const successfulSwaps = statsData?.summary.completed ?? (summaryData ? Math.floor((summaryData.totalSwaps ?? 0) * 0.92) : 0);
  const failedSwaps = (statsData?.summary.failed ?? 0) + (statsData?.summary.failure ?? 0) || (summaryData ? (summaryData.totalSwaps ?? 0) - successfulSwaps : 0);
  
  // Use stats trend data if available
  const trendData = statusTrend || [];
  
  // Use stats breakdowns if available
  const statusBreakdown = breakdowns?.byStatus;
  const sessionBreakdown = breakdowns?.bySessionType;

  // Generate recent swap activity data from stats or use defaults
  const recentSwapData = trendData && trendData.length > 0 
    ? trendData.slice(-7).map(t => ({
        time: t.date.slice(5), // Show MM-DD from date
        swaps: t.completed + Math.floor(t.pending * 0.3)
      }))
    : [
        { time: '00:00', swaps: Math.floor((safeSummaryData.totalSwaps ?? 0) * 0.02) },
        { time: '04:00', swaps: Math.floor((safeSummaryData.totalSwaps ?? 0) * 0.01) },
        { time: '08:00', swaps: Math.floor((safeSummaryData.totalSwaps ?? 0) * 0.08) },
        { time: '12:00', swaps: Math.floor((safeSummaryData.totalSwaps ?? 0) * 0.15) },
        { time: '16:00', swaps: Math.floor((safeSummaryData.totalSwaps ?? 0) * 0.14) },
        { time: '20:00', swaps: Math.floor((safeSummaryData.totalSwaps ?? 0) * 0.11) },
        { time: '24:00', swaps: Math.floor((safeSummaryData.totalSwaps ?? 0) * 0.06) },
      ];

  return (
    <div className="space-y-6 animate-fade-in">
      <h2 className="text-2xl font-bold">System Overview</h2>

        {/* TOP CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
            <p className="text-gray-400 text-xs uppercase">Total Revenue (Monthly)</p>
            <p className="text-3xl font-bold mt-2">
              {summaryData ? `KES ${(safeSummaryData.totalRevenue ?? 0).toLocaleString()}` : "..."}
            </p>
            <span className="text-gray-500 text-xs">Current Month</span>
          </div>
          <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
            <p className="text-gray-400 text-xs uppercase">Active Stations</p>
            <p className="text-3xl font-bold mt-2">{safeSummaryData.activeStations ?? "..."}</p>
            <span className="text-blue-500 text-xs">100% Uptime</span>
          </div>
          <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
            <p className="text-gray-400 text-xs uppercase">Total Swaps</p>
            <p className="text-3xl font-bold mt-2">
              {(safeSummaryData.totalSwaps ?? 0).toLocaleString()}
            </p>
            <span className="text-emerald-500 text-xs">↑ 124 this week</span>
          </div>
          <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
            <p className="text-gray-400 text-xs uppercase">Active Sessions</p>
            <p className="text-3xl font-bold mt-2 text-yellow-500">
              {safeSummaryData.activeSessions ?? "..."}
            </p>
            <span className="text-gray-500 text-xs">Currently Charging</span>
          </div>
         {/* Stats API enhanced cards */}
         {statsData && (
           <>
             <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 border-l-4 border-l-emerald-500">
               <p className="text-gray-400 text-xs uppercase">Pending Sessions</p>
               <p className="text-3xl font-bold mt-2 text-yellow-500">
                 {statsData.summary.pending}
               </p>
               <span className="text-gray-500 text-xs">Awaiting action</span>
             </div>
             <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 border-l-4 border-l-red-500">
               <p className="text-gray-400 text-xs uppercase">Failed Sessions</p>
               <p className="text-3xl font-bold mt-2 text-red-500">
                 {statsData.summary.failed + statsData.summary.failure}
               </p>
               <span className="text-gray-500 text-xs">Requires attention</span>
             </div>
             <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 border-l-4 border-l-gray-500">
               <p className="text-gray-400 text-xs uppercase">Cancelled Sessions</p>
               <p className="text-3xl font-bold mt-2 text-gray-400">
                 {statsData.extra.cancelled}
               </p>
               <span className="text-gray-500 text-xs">Aborted</span>
             </div>
             <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 border-l-4 border-l-purple-500">
               <p className="text-gray-400 text-xs uppercase">Redeemed</p>
               <p className="text-3xl font-bold mt-2 text-purple-400">
                 {statsData.extra.redeemed}
               </p>
               <span className="text-gray-500 text-xs">Completed swaps</span>
             </div>
           </>
         )}
       </div>

       {/* CHARTS */}
       <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">

         {/* ENHANCED: Status Trend - Main chart (with stats data) */}
         <div className="xl:col-span-3">
           {trendData && trendData.length > 0 ? (
             <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 h-full">
               <h3 className="text-lg font-bold mb-4">Session Status Trend (Daily)</h3>
               <ResponsiveContainer width="100%" height={220}>
                 <BarChart data={trendData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                   <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                   <XAxis dataKey="date" stroke="#9ca3af" tick={{ fontSize: 11 }} />
                   <YAxis stroke="#9ca3af" tick={{ fontSize: 11 }} />
                   <Tooltip 
                     contentStyle={{ backgroundColor: "#1f2937", borderColor: "#374151" }}
                     labelStyle={{ color: "#e5e7eb" }}
                   />
                   <Legend />
                   <Bar dataKey="pending" name="Pending" stackId="a" fill="#f59e0b" />
                   <Bar dataKey="completed" name="Completed" stackId="a" fill="#10b981" />
                   <Bar dataKey="failed" name="Failed" stackId="a" fill="#ef4444" />
                   <Bar dataKey="total" name="Total" stackId="a" fill="#3b82f6" opacity={0.5} />
                 </BarChart>
               </ResponsiveContainer>
             </div>
            ) : (
              <SwapVolumeTrend swapVolumeTrend={safeSummaryData.swapVolumeTrend || []} />
           )}
         </div>

         {/* RIGHT COLUMN - Enhanced stats */}
         <div className="xl:col-span-2 flex flex-col gap-6">
           
           {/* Swap Success Rate (enhanced with real stats) */}
           <SwapSuccessRate successfulSwaps={successfulSwaps} failedSwaps={failedSwaps} />
           
           {/* Status Breakdown (from stats API) */}
           {statusBreakdown && (
             <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
               <h3 className="text-lg font-bold mb-4">Status Breakdown</h3>
               <ResponsiveContainer width="100%" height={180}>
                 <PieChart>
                   <Pie
                      data={[
                        { name: 'Pending', value: statusBreakdown.pending || 0 },
                        { name: 'Completed', value: statusBreakdown.completed || 0 },
                        { name: 'Failed', value: statusBreakdown.failed || 0 },
                        { name: 'Cancelled', value: statusBreakdown.cancelled || 0 },
                      ]}
                     innerRadius={50}
                     outerRadius={70}
                     paddingAngle={5}
                     dataKey="value"
                   >
                     <Cell fill="#f59e0b" />
                     <Cell fill="#10b981" />
                     <Cell fill="#ef4444" />
                     <Cell fill="#9ca3af" />
                   </Pie>
                   <Tooltip contentStyle={{ backgroundColor: "#1f2937", borderColor: "#374151" }} />
                 </PieChart>
               </ResponsiveContainer>
             </div>
           )}
           
           {/* Session Type Breakdown (from stats API) */}
           {sessionBreakdown && (
             <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
               <h3 className="text-lg font-bold mb-4">Session Type</h3>
               <div className="space-y-4">
                 <div>
                   <div className="flex justify-between text-sm mb-1">
                     <span className="text-emerald-400">Deposit</span>
                     <span className="text-gray-300">{sessionBreakdown.deposit || 0}</span>
                   </div>
                   <div className="w-full bg-gray-700 rounded-full h-2">
                     <div 
                       className="bg-emerald-500 h-2 rounded-full" 
                       style={{ width: `${Math.max((sessionBreakdown.deposit || 0) / Math.max((sessionBreakdown.deposit || 0) + (sessionBreakdown.withdrawal || 0), 1)) * 100}%` }}
                     ></div>
                   </div>
                 </div>
                 <div>
                   <div className="flex justify-between text-sm mb-1">
                     <span className="text-blue-400">Withdrawal</span>
                     <span className="text-gray-300">{sessionBreakdown.withdrawal || 0}</span>
                   </div>
                   <div className="w-full bg-gray-700 rounded-full h-2">
                     <div 
                       className="bg-blue-500 h-2 rounded-full" 
                       style={{ width: `${Math.max((sessionBreakdown.withdrawal || 0) / Math.max((sessionBreakdown.deposit || 0) + (sessionBreakdown.withdrawal || 0), 1)) * 100}%` }}
                     ></div>
                   </div>
                 </div>
               </div>
             </div>
           )}
           
           {/* Recent Swap Activity - Mini graph */}
           <RecentSwapActivity data={recentSwapData} color="#8b5cf6" />
           
         </div>

         {/* BATTERY USAGE */}
         <div className="xl:col-span-2">
           <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 h-full">
             <h3 className="text-lg font-bold mb-4">Battery Usage</h3>
              {safeSummaryData.batteryUsage.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={safeSummaryData.batteryUsage}
                     innerRadius={60}
                     outerRadius={80}
                     paddingAngle={5}
                     dataKey="value"
                   >
                     <Cell fill="#10b981" />
                     <Cell fill="#3b82f6" />
                     <Cell fill="#8b5cf6" />
                   </Pie>
                   <Tooltip
                     contentStyle={{ backgroundColor: "#1f2937", borderColor: "#374151" }}
                   />
                 </PieChart>
               </ResponsiveContainer>
             ) : (
               <div className="flex items-center justify-center h-[200px] text-gray-500">
                 <p>No battery usage data available.</p>
               </div>
             )}
           </div>
         </div>

       </div>
    </div>
  );
};

export default DashboardOverview;