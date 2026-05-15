import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { api } from '../services/api';
import { TokenUsageChart } from '../components/analytics/TokenUsageChart';
import { CostBreakdown } from '../components/analytics/CostBreakdown';
import { LoadingSpinner } from '../components/common/LoadingSpinner';

export const AnalyticsPage: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.getAnalytics()
      .then(setData)
      .catch((err: any) => {
        setError(err.message);
        setData({
          total_tasks: 42, completed_tasks: 35, failed_tasks: 3,
          total_tokens_used: 125000, total_cost: 0.0188, avg_latency_ms: 4200,
          tasks_by_status: { complete: 35, error: 3, pending: 2, executing: 1 },
          daily_usage: Array.from({ length: 14 }, (_, i) => ({
            date: new Date(Date.now() - (13 - i) * 86400000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            tokens: Math.floor(Math.random() * 15000) + 3000,
            tasks: Math.floor(Math.random() * 8) + 1, cost: Math.random() * 0.005,
          })),
        });
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="page-container"><LoadingSpinner message="Loading analytics..." /></div>;

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>📊 Analytics Dashboard</h1>
        <p>Monitor your AI agent usage, costs, and performance</p>
      </div>
      {error && (
        <div style={{ padding: '0.75rem 1rem', background: 'rgba(255,217,61,0.1)', border: '1px solid rgba(255,217,61,0.2)', borderRadius: '10px', color: 'var(--color-accent-warning)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
          ⚠️ Showing demo data — {error}
        </div>
      )}
      {data && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <CostBreakdown tasksByStatus={data.tasks_by_status} totalTokens={data.total_tokens_used} totalCost={data.total_cost} avgLatency={data.avg_latency_ms} />
          <TokenUsageChart data={data.daily_usage} />
        </motion.div>
      )}
    </div>
  );
};
