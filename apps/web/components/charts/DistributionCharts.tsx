/**
 * Distribution Chart Components
 * 
 * Reusable chart components for displaying aggregated study data
 */

'use client';

import React from 'react';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

// Color palettes for different chart types
export const COLORS = {
  primary: ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#6366f1', '#14b8a6', '#f97316'],
  health: ['#10b981', '#fbbf24', '#ef4444'],
  demographics: ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b'],
  lifestyle: ['#10b981', '#ef4444', '#6366f1'],
};

interface DistributionData {
  name: string;
  value: number;
  percentage?: number;
}

interface BarChartProps {
  data: DistributionData[];
  title: string;
  xAxisLabel?: string;
  yAxisLabel?: string;
  color?: string;
}

export const DistributionBarChart: React.FC<BarChartProps> = ({
  data,
  title,
  xAxisLabel = 'Category',
  yAxisLabel = 'Count',
  color = '#3b82f6',
}) => {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        No data available
      </div>
    );
  }

  return (
    <div className="w-full">
      <h3 className="text-sm font-semibold mb-4 text-gray-700">{title}</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart
          data={data}
          margin={{ top: 10, right: 30, left: 0, bottom: 60 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="name"
            angle={-45}
            textAnchor="end"
            height={80}
            tick={{ fontSize: 12 }}
            label={{ value: xAxisLabel, position: 'insideBottom', offset: -50 }}
          />
          <YAxis
            label={{ value: yAxisLabel, angle: -90, position: 'insideLeft' }}
            tick={{ fontSize: 12 }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#fff',
              border: '1px solid #e5e7eb',
              borderRadius: '6px',
              padding: '8px',
            }}
            formatter={(value: number) => {
              const total = data.reduce((sum, item) => sum + item.value, 0);
              const percentage = ((value / total) * 100).toFixed(1);
              return [`${value} (${percentage}%)`, 'Count'];
            }}
          />
          <Legend />
          <Bar dataKey="value" fill={color} name="Participants" radius={[8, 8, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

interface PieChartProps {
  data: DistributionData[];
  title: string;
  colors?: string[];
}

export const DistributionPieChart: React.FC<PieChartProps> = ({
  data,
  title,
  colors = COLORS.primary,
}) => {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        No data available
      </div>
    );
  }

  const total = data.reduce((sum, item) => sum + item.value, 0);
  const dataWithPercentage = data.map((item) => ({
    ...item,
    percentage: ((item.value / total) * 100),
  }));

  return (
    <div className="w-full">
      <h3 className="text-sm font-semibold mb-4 text-gray-700">{title}</h3>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={dataWithPercentage}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={(entry: any) => `${entry.name}: ${entry.percentage.toFixed(1)}%`}
            outerRadius={100}
            fill="#8884d8"
            dataKey="value"
          >
            {dataWithPercentage.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: '#fff',
              border: '1px solid #e5e7eb',
              borderRadius: '6px',
              padding: '8px',
            }}
            formatter={(value: number) => {
              const percentage = ((value / total) * 100).toFixed(1);
              return [`${value} (${percentage}%)`, 'Count'];
            }}
          />
          <Legend verticalAlign="bottom" height={36} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

interface StatCardProps {
  label: string;
  value: string | number;
  subtext?: string;
  icon?: React.ReactNode;
  color?: 'blue' | 'green' | 'purple' | 'orange';
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  subtext,
  icon,
  color = 'blue',
}) => {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
    green: 'bg-green-50 text-green-700 border-green-200',
    purple: 'bg-purple-50 text-purple-700 border-purple-200',
    orange: 'bg-orange-50 text-orange-700 border-orange-200',
  };

  return (
    <div className={`p-4 rounded-lg border ${colorClasses[color]}`}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium opacity-80">{label}</p>
          <p className="text-2xl font-bold mt-1">{value}</p>
          {subtext && <p className="text-xs opacity-70 mt-1">{subtext}</p>}
        </div>
        {icon && <div className="ml-4">{icon}</div>}
      </div>
    </div>
  );
};
