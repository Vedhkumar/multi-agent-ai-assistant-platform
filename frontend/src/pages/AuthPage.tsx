import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';

export const AuthPage: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const { login, register, isLoading, error, clearError } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isLogin) {
        await login(email, password);
      } else {
        await register(email, username, password);
      }
    } catch {}
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    clearError();
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '0.85rem 1rem', background: 'var(--color-bg-input)',
    border: '1px solid var(--color-border)', borderRadius: '10px',
    color: 'var(--color-text-primary)', fontSize: '0.9rem', outline: 'none',
    transition: 'border-color 150ms ease, box-shadow 150ms ease',
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--color-bg-primary)',
      backgroundImage: 'radial-gradient(circle at 30% 20%, rgba(108,99,255,0.08) 0%, transparent 50%), radial-gradient(circle at 70% 80%, rgba(0,212,170,0.06) 0%, transparent 50%)',
    }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: 'spring', damping: 20 }}
        style={{
          width: '100%', maxWidth: 420, padding: '2.5rem',
          background: 'var(--glass-bg)', backdropFilter: 'var(--glass-blur)',
          border: '1px solid var(--glass-border)', borderRadius: '20px',
          boxShadow: 'var(--glass-shadow)',
        }}
      >
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            width: 64, height: 64, margin: '0 auto 1rem', display: 'flex',
            alignItems: 'center', justifyContent: 'center', fontSize: '2rem',
            background: 'linear-gradient(135deg, var(--color-accent-primary), var(--color-accent-secondary))',
            borderRadius: '16px',
          }}>🤖</div>
          <h1 style={{
            fontSize: '1.75rem', fontWeight: 800,
            background: 'linear-gradient(135deg, var(--color-accent-primary), var(--color-accent-secondary))',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>AgentFlow</h1>
          <p style={{ color: 'var(--color-text-tertiary)', fontSize: '0.85rem', marginTop: '0.25rem' }}>
            Multi-Agent AI Platform
          </p>
        </div>

        {/* Tab Toggle */}
        <div style={{
          display: 'flex', marginBottom: '1.5rem', background: 'var(--color-bg-input)',
          borderRadius: '10px', padding: '4px',
        }}>
          {['Sign In', 'Sign Up'].map((label, i) => (
            <button key={label} onClick={() => { setIsLogin(i === 0); clearError(); }}
              style={{
                flex: 1, padding: '0.6rem', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 600,
                background: (i === 0 ? isLogin : !isLogin) ? 'var(--color-accent-primary)' : 'transparent',
                color: (i === 0 ? isLogin : !isLogin) ? 'white' : 'var(--color-text-secondary)',
                transition: 'all 150ms ease',
              }}>{label}</button>
          ))}
        </div>

        {/* Error */}
        <AnimatePresence>
          {error && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
              style={{
                padding: '0.75rem 1rem', marginBottom: '1rem', borderRadius: '10px',
                background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)',
                color: 'var(--color-status-error)', fontSize: '0.85rem',
              }}>
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required style={inputStyle}
            onFocus={e => { e.target.style.borderColor = 'var(--color-accent-primary)'; e.target.style.boxShadow = '0 0 0 3px rgba(108,99,255,0.15)'; }}
            onBlur={e => { e.target.style.borderColor = 'var(--color-border)'; e.target.style.boxShadow = 'none'; }} />

          {!isLogin && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
              <input type="text" placeholder="Username" value={username} onChange={e => setUsername(e.target.value)} required style={inputStyle}
                onFocus={e => { e.target.style.borderColor = 'var(--color-accent-primary)'; e.target.style.boxShadow = '0 0 0 3px rgba(108,99,255,0.15)'; }}
                onBlur={e => { e.target.style.borderColor = 'var(--color-border)'; e.target.style.boxShadow = 'none'; }} />
            </motion.div>
          )}

          <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required minLength={8} style={inputStyle}
            onFocus={e => { e.target.style.borderColor = 'var(--color-accent-primary)'; e.target.style.boxShadow = '0 0 0 3px rgba(108,99,255,0.15)'; }}
            onBlur={e => { e.target.style.borderColor = 'var(--color-border)'; e.target.style.boxShadow = 'none'; }} />

          <motion.button type="submit" className="btn btn-primary" disabled={isLoading}
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            style={{ padding: '0.85rem', fontSize: '1rem', width: '100%', marginTop: '0.5rem' }}>
            {isLoading ? 'Please wait...' : isLogin ? 'Sign In' : 'Create Account'}
          </motion.button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.8rem', color: 'var(--color-text-tertiary)' }}>
          {isLogin ? "Don't have an account? " : 'Already have an account? '}
          <button onClick={toggleMode} style={{ color: 'var(--color-accent-primary)', fontWeight: 600, fontSize: '0.8rem' }}>
            {isLogin ? 'Sign up' : 'Sign in'}
          </button>
        </p>
      </motion.div>
    </div>
  );
};
