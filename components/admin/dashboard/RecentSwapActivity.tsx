import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface RecentSwapActivityProps {
  data: { time: string; swaps: number }[];
  color?: string;
}

const RecentSwapActivity: React.FC<RecentSwapActivityProps> = ({ data, color = '#8b5cf6' }) => {
  return (
    <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 h-full">
      <h3 className="text-lg font-bold mb-4">Recent Swap Activity</h3>
      
      <div className="flex flex-col gap-1 mb-4">
        <div className="flex items-baseline gap-2">
          <p className="text-2xl font-bold text-white">{data[data.length - 1]?.swaps ?? 0}</p>
          <span className="text-gray-400 text-sm">swaps (latest)</span>
        </div>
        <p className="text-gray-500 text-xs">Last 24 hours</p>
      </div>

      <div className="h-[160px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
            <defs>
              <linearGradient id="recentColor" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.4} />
                <stop offset="95%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            
            <CartesianGrid strokeDasharray="2 2" stroke="#374151" />
            <XAxis 
              dataKey="time" 
              stroke="#6b7280" 
              fontSize={10}
              tick={{ fill: '#6b7280' }}
              interval="preserveStartEnd"
            />
            <YAxis 
              hide={true} 
              domain={[0, 'dataMax + 2']}
            />
            
            <Tooltip
              contentStyle={{
                backgroundColor: "#1f2937",
                borderColor: "#374151",
                fontSize: "12px"
              }}
              labelStyle={{ color: '#9ca3af' }}
              formatter={(value: number) => [value.toLocaleString(), 'swaps']}
            />

            <Area
              type="monotone"
              dataKey="swaps"
              stroke={color}
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#recentColor)"
              dot={false}
              activeDot={{ r: 4, stroke: color, strokeWidth: 2, fill: '#fff' }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default RecentSwapActivity;