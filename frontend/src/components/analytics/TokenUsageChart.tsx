/**
 * Token usage line chart component.
 */
import React from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Area, AreaChart,
} from 'recharts';

interface TokenUsageChartProps {
  data: Array<{ date: string; tokens: number; tasks: number }>;
}

export const TokenUsageChart: React.FC<TokenUsageChartProps> = ({ data }) => {
  return (
    <div className="card" style={{ padding: 'var(--space-6)' }}>
      <h3 style={{ marginBottom: 'var(--space-4)', fontSize: 'var(--font-size-lg)', fontWeight: 700 }}>
        📈 Token Usage Over Time
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="tokenGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#6c63ff" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#6c63ff" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
          <XAxis
            dataKey="date"
            stroke="var(--color-text-tertiary)"
            fontSize={12}
            tickLine={false}
          />
          <YAxis
            stroke="var(--color-text-tertiary)"
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            contentStyle={{
              background: 'var(--color-bg-secondary)',
              border: '1px solid var(--color-border)',
              borderRadius: '10px',
              color: 'var(--color-text-primary)',
              fontSize: '0.85rem',
            }}
          />
          <Area
            type="monotone"
            dataKey="tokens"
            stroke="#6c63ff"
            strokeWidth={2}
            fill="url(#tokenGradient)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};
