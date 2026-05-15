/**
 * Tool call display card.
 */
import React from 'react';
import { motion } from 'framer-motion';

interface ToolCallCardProps {
  toolName: string;
  input?: Record<string, any>;
  output?: string;
  duration?: number;
}

export const ToolCallCard: React.FC<ToolCallCardProps> = ({
  toolName,
  input,
  output,
  duration,
}) => {
  return (
    <motion.div
      className="card"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      style={{ padding: 'var(--space-4)', fontSize: 'var(--font-size-xs)' }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-2)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <span>🔧</span>
          <span style={{ fontWeight: 600, color: 'var(--color-accent-secondary)' }}>{toolName}</span>
        </div>
        {duration && (
          <span style={{ color: 'var(--color-text-tertiary)' }}>{duration}ms</span>
        )}
      </div>

      {input && (
        <div style={{ marginBottom: 'var(--space-2)' }}>
          <span style={{ color: 'var(--color-text-tertiary)' }}>Input: </span>
          <code style={{
            background: 'var(--color-bg-input)',
            padding: '2px 6px',
            borderRadius: '4px',
            fontSize: '0.8em',
          }}>
            {JSON.stringify(input).slice(0, 100)}
          </code>
        </div>
      )}

      {output && (
        <div>
          <span style={{ color: 'var(--color-text-tertiary)' }}>Output: </span>
          <span style={{ color: 'var(--color-text-secondary)' }}>
            {output.slice(0, 150)}{output.length > 150 ? '...' : ''}
          </span>
        </div>
      )}
    </motion.div>
  );
};
