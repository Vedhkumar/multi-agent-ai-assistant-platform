/**
 * Source citation card component.
 */
import React from 'react';
import { motion } from 'framer-motion';

interface SourceCardProps {
  title: string;
  url: string;
  snippet?: string;
}

export const SourceCard: React.FC<SourceCardProps> = ({ title, url, snippet }) => {
  return (
    <motion.a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="card"
      style={{
        display: 'block',
        padding: 'var(--space-4)',
        textDecoration: 'none',
        cursor: 'pointer',
      }}
      whileHover={{ scale: 1.02, y: -2 }}
      transition={{ type: 'spring', stiffness: 400 }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
        <span style={{ fontSize: '0.9rem' }}>🔗</span>
        <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600, color: 'var(--color-accent-primary)' }}>
          {title}
        </span>
      </div>
      <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-tertiary)', marginBottom: 'var(--space-2)' }}>
        {new URL(url).hostname}
      </p>
      {snippet && (
        <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
          {snippet}
        </p>
      )}
    </motion.a>
  );
};
