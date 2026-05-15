/**
 * Sidebar navigation component with glassmorphism design.
 */
import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../hooks/useAuth';
import { ThemeToggle } from './ThemeToggle';
import './Sidebar.css';

const navItems = [
  { path: '/', icon: '💬', label: 'Chat', id: 'nav-chat' },
  { path: '/history', icon: '📋', label: 'History', id: 'nav-history' },
  { path: '/analytics', icon: '📊', label: 'Analytics', id: 'nav-analytics' },
  { path: '/settings', icon: '⚙️', label: 'Settings', id: 'nav-settings' },
];

export const Sidebar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, isAuthenticated } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <motion.aside
      className={`sidebar ${collapsed ? 'sidebar--collapsed' : ''}`}
      initial={{ x: -280 }}
      animate={{ x: 0 }}
      transition={{ type: 'spring', damping: 25 }}
    >
      {/* Logo */}
      <div className="sidebar__logo" onClick={() => navigate('/')}>
        <div className="sidebar__logo-icon">🤖</div>
        {!collapsed && (
          <motion.div
            className="sidebar__logo-text"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <span className="sidebar__logo-name">AgentFlow</span>
            <span className="sidebar__logo-badge">v1.0</span>
          </motion.div>
        )}
      </div>

      {/* Navigation */}
      <nav className="sidebar__nav">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.path}
              id={item.id}
              className={`sidebar__nav-item ${isActive ? 'sidebar__nav-item--active' : ''}`}
              onClick={() => navigate(item.path)}
            >
              {isActive && (
                <motion.div
                  className="sidebar__nav-indicator"
                  layoutId="nav-indicator"
                  transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                />
              )}
              <span className="sidebar__nav-icon">{item.icon}</span>
              {!collapsed && <span className="sidebar__nav-label">{item.label}</span>}
            </button>
          );
        })}
      </nav>

      {/* Bottom Section */}
      <div className="sidebar__bottom">
        <ThemeToggle collapsed={collapsed} />

        <button
          className="sidebar__collapse-btn"
          onClick={() => setCollapsed(!collapsed)}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <span style={{ transform: collapsed ? 'rotate(180deg)' : 'none', display: 'inline-block', transition: 'transform 0.3s' }}>
            ◀
          </span>
        </button>

        {isAuthenticated && (
          <div className="sidebar__user">
            <div className="sidebar__user-avatar">
              {user?.username?.charAt(0).toUpperCase() || '?'}
            </div>
            {!collapsed && (
              <div className="sidebar__user-info">
                <span className="sidebar__user-name">{user?.username}</span>
                <button className="sidebar__logout" onClick={logout}>
                  Sign out
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </motion.aside>
  );
};
