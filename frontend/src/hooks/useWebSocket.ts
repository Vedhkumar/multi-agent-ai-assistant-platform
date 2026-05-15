/**
 * WebSocket hook for real-time agent activity streaming.
 */
import { useEffect, useRef, useCallback } from 'react';
import { useChatStore, AgentEvent } from '../stores/chatStore';

export function useWebSocket(taskId: string | null) {
  const addAgentEvent = useChatStore((s) => s.addAgentEvent);
  const wsRef = useRef<WebSocket | null>(null);

  const connect = useCallback((id: string) => {
    if (wsRef.current) {
      wsRef.current.close();
    }

    const wsBase = import.meta.env.VITE_WS_URL || window.location.origin.replace('http', 'ws');
    const ws = new WebSocket(`${wsBase}/ws/tasks/${id}`);

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as AgentEvent;
        addAgentEvent(data);
      } catch {
        console.error('Failed to parse WebSocket message');
      }
    };

    wsRef.current = ws;
    return ws;
  }, [addAgentEvent]);

  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (taskId) {
      connect(taskId);
    }
    return () => disconnect();
  }, [taskId, connect, disconnect]);

  return { connect, disconnect };
}
