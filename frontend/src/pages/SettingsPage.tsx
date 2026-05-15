import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

export const SettingsPage: React.FC = () => {
  const [openaiKey, setOpenaiKey] = useState('');
  const [tavilyKey, setTavilyKey] = useState('');
  const [e2bKey, setE2bKey] = useState('');
  const [model, setModel] = useState('gpt-4o-mini');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const s = localStorage.getItem('app-settings');
    if (s) {
      const p = JSON.parse(s);
      setOpenaiKey(p.openaiKey || '');
      setTavilyKey(p.tavilyKey || '');
      setE2bKey(p.e2bKey || '');
      setModel(p.model || 'gpt-4o-mini');
    }
  }, []);

  const handleSave = () => {
    localStorage.setItem('app-settings', JSON.stringify({ openaiKey, tavilyKey, e2bKey, model }));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '0.75rem 1rem', background: 'var(--color-bg-input)',
    border: '1px solid var(--color-border)', borderRadius: '10px',
    color: 'var(--color-text-primary)', fontSize: '0.875rem', outline: 'none',
  };

  const labelStyle: React.CSSProperties = {
    display: 'block', fontSize: '0.875rem', fontWeight: 600,
    color: 'var(--color-text-primary)', marginBottom: '0.5rem',
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>⚙️ Settings</h1>
        <p>Configure your API keys and preferences</p>
      </div>

      <div style={{ maxWidth: 600, display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        {/* API Keys */}
        <div className="card" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '1.5rem' }}>🔑 API Keys</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div>
              <label style={labelStyle}>OpenAI API Key</label>
              <input type="password" value={openaiKey} onChange={e => setOpenaiKey(e.target.value)} placeholder="sk-..." style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Tavily API Key</label>
              <input type="password" value={tavilyKey} onChange={e => setTavilyKey(e.target.value)} placeholder="tvly-..." style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>E2B API Key</label>
              <input type="password" value={e2bKey} onChange={e => setE2bKey(e.target.value)} placeholder="e2b-..." style={inputStyle} />
            </div>
          </div>
        </div>

        {/* Model Preference */}
        <div className="card" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '1.5rem' }}>🧠 Model Selection</h3>
          <label style={labelStyle}>Preferred Model</label>
          <select value={model} onChange={e => setModel(e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
            <option value="gpt-4o">GPT-4o (Best quality)</option>
            <option value="gpt-4o-mini">GPT-4o-mini (Cost effective)</option>
            <option value="gpt-3.5-turbo">GPT-3.5 Turbo (Fastest)</option>
          </select>
        </div>

        {/* Save */}
        <motion.button className="btn btn-primary" onClick={handleSave} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
          style={{ padding: '0.75rem 2rem', fontSize: '1rem', alignSelf: 'flex-start' }}>
          {saved ? '✓ Saved!' : '💾 Save Settings'}
        </motion.button>
      </div>
    </div>
  );
};
