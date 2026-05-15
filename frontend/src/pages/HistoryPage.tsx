/**
 * History page — task history with search, filter, and expandable details.
 */
import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useChatStore, Task } from '../stores/chatStore';
import { LoadingSpinner } from '../components/common/LoadingSpinner';

export const HistoryPage: React.FC = () => {
  const tasks = useChatStore((s) => s.tasks);
  const loadTasks = useChatStore((s) => s.loadTasks);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    loadTasks().finally(() => setLoading(false));
  }, [loadTasks]);

  const filtered = tasks.filter((t) => {
    if (statusFilter !== 'all' && t.status !== statusFilter) return false;
    if (search && !t.title.toLowerCase().includes(search.toLowerCase()) &&
        !t.input_text.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>📋 Task History</h1>
        <p>Browse your past tasks and agent execution traces</p>
      </div>

      {/* Filters */}
      <div style={{
        display: 'flex', gap: 'var(--space-4)', marginBottom: 'var(--space-6)',
        flexWrap: 'wrap', alignItems: 'center',
      }}>
        <input
          type="text"
          placeholder="Search tasks..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            flex: 1, minWidth: 200, padding: 'var(--space-3) var(--space-4)',
            background: 'var(--color-bg-input)', border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-md)', color: 'var(--color-text-primary)',
            outline: 'none', fontSize: 'var(--font-size-sm)',
          }}
        />
        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          {['all', 'complete', 'error', 'pending', 'executing'].map((s) => (
            <button
              key={s}
              className={`btn ${statusFilter === s ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setStatusFilter(s)}
              style={{ textTransform: 'capitalize', fontSize: 'var(--font-size-xs)' }}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Task List */}
      {loading ? (
        <LoadingSpinner message="Loading task history..." />
      ) : filtered.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: 'var(--space-16)',
          color: 'var(--color-text-tertiary)',
        }}>
          <p style={{ fontSize: '3rem', marginBottom: 'var(--space-4)' }}>📭</p>
          <p>No tasks found. Start a conversation to see your history here.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          {filtered.map((task, i) => (
            <motion.div
              key={task.id}
              className="card"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              style={{ cursor: 'pointer' }}
              onClick={() => setExpandedId(expandedId === task.id ? null : task.id)}
            >
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-2)' }}>
                    <span className={`status-badge status-${task.status}`}>{task.status}</span>
                    <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-tertiary)' }}>
                      {new Date(task.created_at).toLocaleDateString()} {new Date(task.created_at).toLocaleTimeString()}
                    </span>
                  </div>
                  <h3 style={{ fontSize: 'var(--font-size-base)', fontWeight: 600, marginBottom: 'var(--space-1)' }}>
                    {task.title}
                  </h3>
                  <p style={{
                    fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)',
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                  }}>
                    {task.input_text}
                  </p>
                </div>
                <div style={{
                  display: 'flex', gap: 'var(--space-4)', alignItems: 'center',
                  color: 'var(--color-text-tertiary)', fontSize: 'var(--font-size-xs)',
                }}>
                  <span>🪙 {task.total_tokens}</span>
                  <span>⏱ {task.latency_ms}ms</span>
                  <span style={{
                    transform: expandedId === task.id ? 'rotate(180deg)' : 'none',
                    transition: 'transform 0.3s',
                  }}>▼</span>
                </div>
              </div>

              <AnimatePresence>
                {expandedId === task.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    style={{ overflow: 'hidden', marginTop: 'var(--space-4)' }}
                  >
                    <div style={{
                      padding: 'var(--space-4)',
                      background: 'var(--color-bg-input)',
                      borderRadius: 'var(--radius-md)',
                      fontSize: 'var(--font-size-sm)',
                    }}>
                      {task.result ? (
                        <div>
                          <h4 style={{ marginBottom: 'var(--space-2)', color: 'var(--color-accent-secondary)' }}>Result</h4>
                          <pre style={{
                            whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                            color: 'var(--color-text-primary)', lineHeight: 1.6,
                          }}>
                            {task.result.slice(0, 2000)}{task.result.length > 2000 ? '...' : ''}
                          </pre>
                        </div>
                      ) : task.error_message ? (
                        <div style={{ color: 'var(--color-status-error)' }}>
                          <h4 style={{ marginBottom: 'var(--space-2)' }}>Error</h4>
                          <p>{task.error_message}</p>
                        </div>
                      ) : (
                        <p style={{ color: 'var(--color-text-tertiary)' }}>No result available yet.</p>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};
