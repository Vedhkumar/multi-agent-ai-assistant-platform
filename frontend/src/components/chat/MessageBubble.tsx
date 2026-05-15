/**
 * Chat message bubble component with markdown rendering.
 */
import React from 'react';
import ReactMarkdown from 'react-markdown';
import { motion } from 'framer-motion';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { ChatMessage } from '../../stores/chatStore';
import './MessageBubble.css';

interface MessageBubbleProps {
  message: ChatMessage;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const isUser = message.role === 'user';
  const isSystem = message.role === 'system';

  const avatarContent = isUser ? '👤' : isSystem ? '⚠️' : '🤖';
  const avatarClass = isUser ? 'avatar--user' : isSystem ? 'avatar--system' : 'avatar--assistant';

  return (
    <motion.div
      className={`message-bubble ${isUser ? 'message-bubble--user' : ''} ${isSystem ? 'message-bubble--system' : ''}`}
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className={`message-bubble__avatar ${avatarClass}`}>
        {avatarContent}
      </div>
      <div className="message-bubble__content">
        <div className="message-bubble__header">
          <span className="message-bubble__name">
            {isUser ? 'You' : isSystem ? 'System' : message.agentName || 'AgentFlow'}
          </span>
          <span className="message-bubble__time">
            {new Date(message.timestamp).toLocaleTimeString()}
          </span>
        </div>
        <div className="message-bubble__body">
          <ReactMarkdown
            components={{
              code({ className, children, ...props }) {
                const match = /language-(\w+)/.exec(className || '');
                const isInline = !match;
                return isInline ? (
                  <code className="inline-code" {...props}>{children}</code>
                ) : (
                  <SyntaxHighlighter
                    style={oneDark as any}
                    language={match[1]}
                    PreTag="div"
                    customStyle={{
                      borderRadius: '10px',
                      fontSize: '0.85rem',
                      margin: '0.5rem 0',
                    }}
                  >
                    {String(children).replace(/\n$/, '')}
                  </SyntaxHighlighter>
                );
              },
            }}
          >
            {message.content}
          </ReactMarkdown>
        </div>
      </div>
    </motion.div>
  );
};
