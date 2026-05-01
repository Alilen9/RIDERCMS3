import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface SwapVolumeTrendProps {
  swapVolumeTrend: { time: string; swaps: number }[];
}

 const SwapVolumeTrend: React.FC<SwapVolumeTrendProps> = ({ swapVolumeTrend }) => {
  return (
    <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
      <h3 className="text-lg font-bold mb-4">Swap Volume Trend</h3>

      {swapVolumeTrend?.length > 1 ? (
        <div className="w-full h-[300px] sm:h-[350px] lg:h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={swapVolumeTrend} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <defs>
                <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis 
                dataKey="time" 
                stroke="#9ca3af" 
                fontSize={12}
                tick={{ fill: '#9ca3af' }}
              />
              <YAxis 
                stroke="#9ca3af" 
                tick={{ fill: '#9ca3af' }} 
                tickFormatter={(value) => Math.round(value).toString()}
                allowDecimals={false}
                fontSize={12}
                width={40}
              />

              <Tooltip
                contentStyle={{
                  backgroundColor: "#1f2937",
                  borderColor: "#374151"
                }}
              />

              <Area
                type="monotone"
                dataKey="swaps"
                stroke="#10b981"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorVal)"
                dot={{ fill: '#10b981', strokeWidth: 2, r: 3 }}
                activeDot={{ r: 5, stroke: '#10b981', strokeWidth: 2, fill: '#fff' }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="flex items-center justify-center h-[300px] sm:h-[350px] lg:h-[400px] text-gray-500">
          <p>Not enough data to display trend.</p>
        </div>
      )}
    </div>
  );
};

export default SwapVolumeTrend;