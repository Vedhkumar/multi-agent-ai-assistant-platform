/**
 * Chat input component with auto-resize and keyboard shortcuts.
 */
import React, { useRef, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import './ChatInput.css';

interface ChatInputProps {
  onSend: (message: string) => void;
  isProcessing: boolean;
  onCancel?: () => void;
}

export const ChatInput: React.FC<ChatInputProps> = ({ onSend, isProcessing, onCancel }) => {
  const [value, setValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [value]);

  const handleSubmit = () => {
    const trimmed = value.trim();
    if (!trimmed || isProcessing) return;
    onSend(trimmed);
    setValue('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="chat-input-wrapper">
      <div className="chat-input-container">
        <textarea
          ref={textareaRef}
          id="chat-input"
          className="chat-input__textarea"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Describe your task... (Enter to send, Shift+Enter for new line)"
          disabled={isProcessing}
          rows={1}
        />
        <div className="chat-input__actions">
          {isProcessing ? (
            <motion.button
              className="chat-input__cancel-btn"
              onClick={onCancel}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              title="Cancel task"
            >
              ⏹
            </motion.button>
          ) : (
            <motion.button
              className="chat-input__send-btn"
              onClick={handleSubmit}
              disabled={!value.trim()}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              title="Send message"
            >
              ➤
            </motion.button>
          )}
        </div>
      </div>
      <p className="chat-input__hint">
        AgentFlow uses AI agents that collaborate to complete your tasks.
        {isProcessing && <span className="chat-input__processing"> Agents are working...</span>}
      </p>
    </div>
  );
};
