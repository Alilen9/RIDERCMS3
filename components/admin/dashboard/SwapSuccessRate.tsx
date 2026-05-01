import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

interface SwapSuccessRateProps {
  successfulSwaps: number;
  failedSwaps: number;
}

const SwapSuccessRate: React.FC<SwapSuccessRateProps> = ({ successfulSwaps, failedSwaps }) => {
  const totalSwaps = successfulSwaps + failedSwaps;
  const successRate = totalSwaps > 0 ? ((successfulSwaps / totalSwaps) * 100).toFixed(1) : '0';

  const data = [
    { name: 'Successful', value: successfulSwaps, color: '#10b981' },
    { name: 'Failed', value: failedSwaps, color: '#ef4444' },
  ];

  return (
    <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
      <h3 className="text-lg font-bold mb-4">Swap Success Rate</h3>
      
      <div className="flex flex-col lg:flex-row items-center gap-6">
        {/* Donut Chart */}
        <div className="flex-1 w-full">
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={75}
                paddingAngle={4}
                dataKey="value"
                stroke="#1f2937"
                strokeWidth={2}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1f2937",
                  borderColor: "#374151"
                }}
                formatter={(value: number) => [
                  value.toLocaleString(),
                  value === successfulSwaps ? 'Successful Swaps' : 'Failed Swaps'
                ]}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Stats */}
        <div className="flex-1 w-full space-y-4">
          <div className="text-center lg:text-left">
            <p className="text-gray-400 text-sm uppercase tracking-wide">Success Rate</p>
            <p className="text-4xl font-bold text-emerald-400 mt-1">{successRate}%</p>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-900/50 rounded-lg border border-gray-700">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                <span className="text-gray-300 text-sm">Successful</span>
              </div>
              <span className="text-emerald-400 font-bold text-lg">{successfulSwaps.toLocaleString()}</span>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-gray-900/50 rounded-lg border border-gray-700">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <span className="text-gray-300 text-sm">Failed</span>
              </div>
              <span className="text-red-400 font-bold text-lg">{failedSwaps.toLocaleString()}</span>
            </div>
          </div>

          <div className="pt-3 border-t border-gray-700">
            <div className="flex justify-between items-center">
              <span className="text-gray-400 text-sm">Total Swaps</span>
              <span className="text-white font-bold text-lg">{totalSwaps.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SwapSuccessRate;