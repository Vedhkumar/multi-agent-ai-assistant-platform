/**
 * Theme toggle component for dark/light mode switching.
 */
import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface ThemeToggleProps {
  collapsed?: boolean;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ collapsed }) => {
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem('theme');
    if (saved === 'light') {
      setIsDark(false);
      document.documentElement.setAttribute('data-theme', 'light');
    }
  }, []);

  const toggle = () => {
    const newTheme = isDark ? 'light' : 'dark';
    setIsDark(!isDark);
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
  };

  return (
    <button
      id="theme-toggle"
      onClick={toggle}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        padding: '0.5rem 1rem',
        borderRadius: 'var(--radius-md)',
        color: 'var(--color-text-secondary)',
        fontSize: 'var(--font-size-sm)',
        transition: 'all 150ms ease',
        width: '100%',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = 'var(--color-bg-hover)';
        e.currentTarget.style.color = 'var(--color-text-primary)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'transparent';
        e.currentTarget.style.color = 'var(--color-text-secondary)';
      }}
    >
      <motion.span
        key={isDark ? 'dark' : 'light'}
        initial={{ rotate: -90, scale: 0 }}
        animate={{ rotate: 0, scale: 1 }}
        transition={{ type: 'spring', damping: 15 }}
        style={{ fontSize: '1.2rem', width: '24px', textAlign: 'center' }}
      >
        {isDark ? '🌙' : '☀️'}
      </motion.span>
      {!collapsed && <span>{isDark ? 'Dark Mode' : 'Light Mode'}</span>}
    </button>
  );
};
