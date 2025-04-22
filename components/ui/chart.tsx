'use client';

import {
  Bar,
  BarChart as RechartsBarChart,
  CartesianGrid,
  Line,
  LineChart as RechartsLineChart,
  Tooltip,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Legend,
} from "recharts"

interface ChartProps {
  data: any[];
  index: string;
  categories: string[];
  colors?: string[];
  valueFormatter?: (value: number) => string;
}

export function BarChart({
  data,
  index,
  categories,
  colors = ['#0ea5e9'],
  valueFormatter = (value: number) => `${value}`
}: ChartProps) {
  console.log('BarChart data:', JSON.stringify(data, null, 2));
  console.log('BarChart categories:', categories);
  console.log('BarChart index:', index);

  if (!data?.length) {
    console.warn('No data provided to BarChart');
    return (
      <div className="flex h-[300px] w-full items-center justify-center text-gray-500">
        No data available
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <RechartsBarChart data={data} margin={{ top: 20, right: 20, left: 20, bottom: 20 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.5} />
        <XAxis 
          dataKey={index}
          stroke="#9ca3af"
          fontSize={12}
          tickLine={false}
          axisLine={{ stroke: '#4b5563' }}
          tick={{ fill: '#9ca3af' }}
        />
        <YAxis
          stroke="#9ca3af"
          fontSize={12}
          tickLine={false}
          axisLine={{ stroke: '#4b5563' }}
          tick={{ fill: '#9ca3af' }}
        />
        <Tooltip
          contentStyle={{ 
            backgroundColor: '#1f2937', 
            border: 'none', 
            borderRadius: '8px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
          }}
          labelStyle={{ color: '#fff', marginBottom: '4px' }}
          itemStyle={{ color: '#fff', padding: '2px 0' }}
          formatter={(value: any) => valueFormatter(value)}
        />
        <Legend 
          verticalAlign="top"
          height={36}
          wrapperStyle={{ color: '#9ca3af' }}
        />
        {categories.map((category, idx) => (
          <Bar
            key={category}
            dataKey={category}
            fill={colors[idx % colors.length]}
            radius={[4, 4, 0, 0]}
            barSize={30}
            isAnimationActive={true}
            animationDuration={1000}
            animationBegin={0}
          />
        ))}
      </RechartsBarChart>
    </ResponsiveContainer>
  );
}

export function LineChart({
  data,
  index,
  categories,
  colors = ['#0ea5e9'],
  valueFormatter = (value: number) => `${value}`
}: ChartProps) {
  console.log('LineChart data:', JSON.stringify(data, null, 2));
  console.log('LineChart categories:', categories);
  console.log('LineChart index:', index);

  if (!data?.length) {
    console.warn('No data provided to LineChart');
    return (
      <div className="flex h-[300px] w-full items-center justify-center text-gray-500">
        No data available
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <RechartsLineChart data={data} margin={{ top: 20, right: 20, left: 20, bottom: 20 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.5} />
        <XAxis 
          dataKey={index}
          stroke="#9ca3af"
          fontSize={12}
          tickLine={false}
          axisLine={{ stroke: '#4b5563' }}
          tick={{ fill: '#9ca3af' }}
        />
        <YAxis
          stroke="#9ca3af"
          fontSize={12}
          tickLine={false}
          axisLine={{ stroke: '#4b5563' }}
          tick={{ fill: '#9ca3af' }}
          domain={[0, 'auto']}
        />
        <Tooltip
          contentStyle={{ 
            backgroundColor: '#1f2937', 
            border: 'none', 
            borderRadius: '8px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
          }}
          labelStyle={{ color: '#fff', marginBottom: '4px' }}
          itemStyle={{ color: '#fff', padding: '2px 0' }}
          formatter={(value: any) => valueFormatter(value)}
        />
        <Legend 
          verticalAlign="top"
          height={36}
          wrapperStyle={{ color: '#9ca3af' }}
        />
        {categories.map((category, idx) => (
          <Line
            key={category}
            type="monotone"
            dataKey={category}
            stroke={colors[idx % colors.length]}
            strokeWidth={2}
            dot={{ r: 4, strokeWidth: 2, fill: '#1f2937' }}
            activeDot={{ r: 6, strokeWidth: 2, fill: '#1f2937' }}
            isAnimationActive={true}
            animationDuration={1000}
            animationBegin={idx * 100}
          />
        ))}
      </RechartsLineChart>
    </ResponsiveContainer>
  );
}
