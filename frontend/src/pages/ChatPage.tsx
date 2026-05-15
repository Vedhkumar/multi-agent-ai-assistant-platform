/**
 * Chat page — main interface with ChatGPT-like conversation and agent panel.
 */
import React, { useRef, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useChatStore } from '../stores/chatStore';
import { MessageBubble } from '../components/chat/MessageBubble';
import { ChatInput } from '../components/chat/ChatInput';
import { AgentActivityPanel } from '../components/agents/AgentActivityPanel';
import './ChatPage.css';

export const ChatPage: React.FC = () => {
  const messages = useChatStore((s) => s.messages);
  const isProcessing = useChatStore((s) => s.isProcessing);
  const currentTask = useChatStore((s) => s.currentTask);
  const sendMessage = useChatStore((s) => s.sendMessage);
  const cancelTask = useChatStore((s) => s.cancelTask);
  const clearChat = useChatStore((s) => s.clearChat);
  const [panelOpen, setPanelOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Auto-open panel when processing starts
  useEffect(() => {
    if (isProcessing) setPanelOpen(true);
  }, [isProcessing]);

  const handleCancel = () => {
    if (currentTask) {
      cancelTask(currentTask.id);
    }
  };

  return (
    <div className="chat-page">
      <div className={`chat-page__main ${panelOpen ? 'chat-page__main--panel-open' : ''}`}>
        {/* Header */}
        <div className="chat-page__header">
          <div>
            <h1 className="chat-page__title">AgentFlow Chat</h1>
            <p className="chat-page__subtitle">Multi-agent AI collaboration at your fingertips</p>
          </div>
          <div className="chat-page__header-actions">
            <button className="btn btn-secondary" onClick={clearChat}>
              🗑 Clear
            </button>
            <button
              className={`btn ${panelOpen ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setPanelOpen(!panelOpen)}
            >
              🤖 Agents
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="chat-page__messages">
          {messages.length === 0 && (
            <div className="chat-page__empty">
              <motion.div
                className="chat-page__empty-icon"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', damping: 10 }}
              >
                🤖
              </motion.div>
              <h2>Welcome to AgentFlow</h2>
              <p>Your AI agent team is ready. Describe a task and watch them collaborate.</p>
              <div className="chat-page__suggestions">
                {[
                  'Research the latest trends in generative AI and summarize key findings',
                  'Write a Python script to analyze CSV data and generate statistics',
                  'Compare React vs Vue.js for a new enterprise project',
                  'Create a REST API design for a task management system',
                ].map((suggestion, i) => (
                  <motion.button
                    key={i}
                    className="chat-page__suggestion"
                    onClick={() => sendMessage(suggestion)}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 * i }}
                    whileHover={{ scale: 1.02, y: -2 }}
                  >
                    <span className="chat-page__suggestion-icon">
                      {['🔍', '💻', '⚖️', '🏗️'][i]}
                    </span>
                    {suggestion}
                  </motion.button>
                ))}
              </div>
            </div>
          )}

          {messages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))}

          {isProcessing && (
            <motion.div
              className="chat-page__typing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <div className="typing-dots">
                <span />
                <span />
                <span />
              </div>
              <span>Agents are collaborating on your task...</span>
            </motion.div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <ChatInput
          onSend={sendMessage}
          isProcessing={isProcessing}
          onCancel={handleCancel}
        />
      </div>

      {/* Agent Panel */}
      <AgentActivityPanel isOpen={panelOpen} onToggle={() => setPanelOpen(!panelOpen)} />
    </div>
  );
};
