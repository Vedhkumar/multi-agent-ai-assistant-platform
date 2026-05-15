/**
 * Cost breakdown and agent latency charts.
 */
import React from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts';

interface CostBreakdownProps {
  tasksByStatus: Record<string, number>;
  totalTokens: number;
  totalCost: number;
  avgLatency: number;
}

const STATUS_COLORS: Record<string, string> = {
  complete: '#22c55e',
  error: '#ef4444',
  pending: '#64748b',
  planning: '#6c63ff',
  executing: '#00d4aa',
  reviewing: '#ffd93d',
  cancelled: '#94a3b8',
};

export const CostBreakdown: React.FC<CostBreakdownProps> = ({
  tasksByStatus,
  totalTokens,
  totalCost,
  avgLatency,
}) => {
  const pieData = Object.entries(tasksByStatus).map(([status, count]) => ({
    name: status,
    value: count,
  }));

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-6)' }}>
      {/* Stats Cards */}
      <div className="card" style={{ padding: 'var(--space-6)' }}>
        <h3 style={{ marginBottom: 'var(--space-5)', fontSize: 'var(--font-size-lg)', fontWeight: 700 }}>
          📊 Key Metrics
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
          <StatCard label="Total Tokens" value={totalTokens.toLocaleString()} icon="🪙" color="#6c63ff" />
          <StatCard label="Total Cost" value={`$${totalCost.toFixed(4)}`} icon="💰" color="#00d4aa" />
          <StatCard label="Avg Latency" value={`${avgLatency.toFixed(0)}ms`} icon="⏱" color="#ffd93d" />
          <StatCard
            label="Total Tasks"
            value={Object.values(tasksByStatus).reduce((a, b) => a + b, 0).toString()}
            icon="📋"
            color="#ff6b6b"
          />
        </div>
      </div>

      {/* Status Donut */}
      <div className="card" style={{ padding: 'var(--space-6)' }}>
        <h3 style={{ marginBottom: 'var(--space-4)', fontSize: 'var(--font-size-lg)', fontWeight: 700 }}>
          🎯 Task Distribution
        </h3>
        {pieData.length > 0 ? (
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={85}
                paddingAngle={4}
                dataKey="value"
              >
                {pieData.map((entry) => (
                  <Cell
                    key={entry.name}
                    fill={STATUS_COLORS[entry.name] || '#64748b'}
                  />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: 'var(--color-bg-secondary)',
                  border: '1px solid var(--color-border)',
                  borderRadius: '10px',
                  color: 'var(--color-text-primary)',
                  fontSize: '0.85rem',
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div style={{
            height: 220,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--color-text-tertiary)',
          }}>
            No task data yet
          </div>
        )}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-3)', justifyContent: 'center' }}>
          {pieData.map((entry) => (
            <div key={entry.name} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)' }}>
              <div style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: STATUS_COLORS[entry.name] || '#64748b',
              }} />
              <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', textTransform: 'capitalize' }}>
                {entry.name}: {entry.value}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

function StatCard({ label, value, icon, color }: {
  label: string;
  value: string;
  icon: string;
  color: string;
}) {
  return (
    <div style={{
      padding: 'var(--space-4)',
      borderRadius: 'var(--radius-md)',
      background: `${color}10`,
      border: `1px solid ${color}20`,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
        <span>{icon}</span>
        <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-tertiary)' }}>{label}</span>
      </div>
      <div style={{ fontSize: 'var(--font-size-xl)', fontWeight: 800, color }}>
        {value}
      </div>
    </div>
  );
}
