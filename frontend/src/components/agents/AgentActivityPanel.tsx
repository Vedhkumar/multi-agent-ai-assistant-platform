/**
 * Agent activity panel showing real-time agent status and tool calls.
 */
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useChatStore, AgentEvent } from '../../stores/chatStore';
import { AgentNode } from './AgentNode';
import { ToolCallCard } from './ToolCallCard';
import './AgentActivityPanel.css';

const AGENTS = [
  { name: 'supervisor', icon: '🎯', label: 'Supervisor', color: 'var(--color-agent-supervisor)' },
  { name: 'researcher', icon: '🔍', label: 'Researcher', color: 'var(--color-agent-researcher)' },
  { name: 'coder', icon: '💻', label: 'Coder', color: 'var(--color-agent-coder)' },
  { name: 'reviewer', icon: '✅', label: 'Reviewer', color: 'var(--color-agent-reviewer)' },
];

interface AgentActivityPanelProps {
  isOpen: boolean;
  onToggle: () => void;
}

export const AgentActivityPanel: React.FC<AgentActivityPanelProps> = ({ isOpen, onToggle }) => {
  const agentEvents = useChatStore((s) => s.agentEvents);
  const isProcessing = useChatStore((s) => s.isProcessing);
  const currentTask = useChatStore((s) => s.currentTask);

  // Determine active agent from events
  const lastEvent = agentEvents[agentEvents.length - 1];
  const activeAgent = lastEvent?.agent_name || null;
  const currentStatus = lastEvent?.status || currentTask?.status || 'idle';

  // Determine completed agents
  const completedAgents = new Set(
    agentEvents
      .filter((e) => e.event_type === 'agent_completed')
      .map((e) => e.agent_name)
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="agent-panel"
          initial={{ x: 380, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 380, opacity: 0 }}
          transition={{ type: 'spring', damping: 25 }}
        >
          <div className="agent-panel__header">
            <h3>🤖 Agent Activity</h3>
            <button className="btn-icon" onClick={onToggle}>✕</button>
          </div>

          {/* Status Pipeline */}
          <div className="agent-panel__pipeline">
            {['planning', 'executing', 'reviewing', 'complete'].map((step, i) => (
              <div key={step} className="pipeline-step">
                <div
                  className={`pipeline-dot ${
                    currentStatus === step ? 'pipeline-dot--active' : ''
                  } ${
                    ['complete', 'error'].includes(currentStatus) && i < 3 ? 'pipeline-dot--done' : ''
                  }`}
                />
                <span className="pipeline-label">{step}</span>
                {i < 3 && <div className="pipeline-line" />}
              </div>
            ))}
          </div>

          {/* Agent Nodes */}
          <div className="agent-panel__agents">
            <h4>Agents</h4>
            <div className="agent-nodes">
              {AGENTS.map((agent) => (
                <AgentNode
                  key={agent.name}
                  name={agent.name}
                  label={agent.label}
                  icon={agent.icon}
                  color={agent.color}
                  isActive={activeAgent === agent.name}
                  isCompleted={completedAgents.has(agent.name)}
                />
              ))}
            </div>
          </div>

          {/* Event Stream */}
          <div className="agent-panel__events">
            <h4>Event Stream</h4>
            <div className="event-list">
              {agentEvents.length === 0 && !isProcessing && (
                <p className="event-list__empty">No agent activity yet. Submit a task to get started.</p>
              )}
              {isProcessing && agentEvents.length === 0 && (
                <p className="event-list__empty" style={{ color: 'var(--color-accent-secondary)' }}>
                  Waiting for agent events...
                </p>
              )}
              <AnimatePresence>
                {agentEvents.map((event, i) => (
                  <motion.div
                    key={i}
                    className="event-item"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <div className="event-item__dot" style={{
                      backgroundColor: AGENTS.find(a => a.name === event.agent_name)?.color || 'var(--color-text-tertiary)'
                    }} />
                    <div className="event-item__content">
                      <span className="event-item__type">{event.event_type}</span>
                      <p className="event-item__message">{event.message}</p>
                      {event.metadata && (
                        <div className="event-item__meta">
                          {event.metadata.total_tokens && (
                            <span>🪙 {event.metadata.total_tokens} tokens</span>
                          )}
                          {event.metadata.latency_ms && (
                            <span>⏱ {event.metadata.latency_ms}ms</span>
                          )}
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
