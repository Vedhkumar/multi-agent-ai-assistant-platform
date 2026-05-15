/**
 * Individual agent status node with pulse animation when active.
 */
import React from 'react';
import { motion } from 'framer-motion';

interface AgentNodeProps {
  name: string;
  label: string;
  icon: string;
  color: string;
  isActive: boolean;
  isCompleted: boolean;
}

export const AgentNode: React.FC<AgentNodeProps> = ({
  label,
  icon,
  color,
  isActive,
  isCompleted,
}) => {
  return (
    <motion.div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--space-3)',
        padding: 'var(--space-3) var(--space-4)',
        borderRadius: 'var(--radius-md)',
        background: isActive
          ? `${color}15`
          : 'var(--color-bg-input)',
        border: `1px solid ${isActive ? `${color}40` : 'var(--color-border)'}`,
        position: 'relative',
        overflow: 'hidden',
      }}
      animate={isActive ? { scale: [1, 1.02, 1] } : {}}
      transition={isActive ? { duration: 1.5, repeat: Infinity } : {}}
    >
      {isActive && (
        <motion.div
          style={{
            position: 'absolute',
            inset: 0,
            background: `linear-gradient(90deg, transparent, ${color}10, transparent)`,
          }}
          animate={{ x: ['-100%', '100%'] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      )}
      <span style={{ fontSize: '1.3rem', position: 'relative', zIndex: 1 }}>{icon}</span>
      <div style={{ position: 'relative', zIndex: 1 }}>
        <div style={{
          fontSize: 'var(--font-size-sm)',
          fontWeight: 600,
          color: isActive ? color : 'var(--color-text-primary)',
        }}>
          {label}
        </div>
        <div style={{
          fontSize: 'var(--font-size-xs)',
          color: isActive ? color : isCompleted ? 'var(--color-status-complete)' : 'var(--color-text-tertiary)',
        }}>
          {isActive ? 'Working...' : isCompleted ? 'Done ✓' : 'Idle'}
        </div>
      </div>
    </motion.div>
  );
};
