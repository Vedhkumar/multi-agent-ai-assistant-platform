/**
 * Chat store using Zustand for task and agent event management.
 */
import { create } from 'zustand';
import { api } from '../services/api';

export interface AgentEvent {
  event_type: string;
  agent_name?: string;
  status?: string;
  message?: string;
  tool_name?: string;
  tool_input?: Record<string, any>;
  tool_output?: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface Task {
  id: string;
  user_id: string;
  title: string;
  input_text: string;
  status: string;
  result?: string;
  error_message?: string;
  agent_trace?: Record<string, any>;
  token_usage?: Record<string, any>;
  total_tokens: number;
  total_cost: number;
  latency_ms: number;
  created_at: string;
  started_at?: string;
  completed_at?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  taskId?: string;
  timestamp: string;
  agentName?: string;
}

interface ChatState {
  messages: ChatMessage[];
  currentTask: Task | null;
  agentEvents: AgentEvent[];
  tasks: Task[];
  isProcessing: boolean;
  wsConnection: WebSocket | null;

  sendMessage: (content: string) => Promise<void>;
  loadTasks: (page?: number) => Promise<void>;
  loadTask: (taskId: string) => Promise<void>;
  cancelTask: (taskId: string) => Promise<void>;
  connectWebSocket: (taskId: string) => void;
  disconnectWebSocket: () => void;
  addAgentEvent: (event: AgentEvent) => void;
  clearChat: () => void;
}

export const useChatStore = create<ChatState>()((set, get) => ({
  messages: [],
  currentTask: null,
  agentEvents: [],
  tasks: [],
  isProcessing: false,
  wsConnection: null,

  sendMessage: async (content: string) => {
    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content,
      timestamp: new Date().toISOString(),
    };

    set((state) => ({
      messages: [...state.messages, userMessage],
      isProcessing: true,
      agentEvents: [],
    }));

    try {
      const task = await api.createTask(content);
      
      set((state) => ({
        currentTask: task,
        messages: state.messages.map((m) =>
          m.id === userMessage.id ? { ...m, taskId: task.id } : m
        ),
      }));

      // Connect WebSocket for real-time updates
      get().connectWebSocket(task.id);

      // Poll for completion as fallback
      pollTaskStatus(task.id, set, get);
    } catch (err: any) {
      const errorMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'system',
        content: `Error: ${err.message || 'Failed to submit task'}`,
        timestamp: new Date().toISOString(),
      };

      set((state) => ({
        messages: [...state.messages, errorMessage],
        isProcessing: false,
      }));
    }
  },

  loadTasks: async (page = 1) => {
    try {
      const data = await api.listTasks(page);
      set({ tasks: data.tasks });
    } catch (err) {
      console.error('Failed to load tasks:', err);
    }
  },

  loadTask: async (taskId: string) => {
    try {
      const task = await api.getTask(taskId);
      set({ currentTask: task });
    } catch (err) {
      console.error('Failed to load task:', err);
    }
  },

  cancelTask: async (taskId: string) => {
    try {
      await api.cancelTask(taskId);
      get().disconnectWebSocket();
      set({ isProcessing: false });
    } catch (err) {
      console.error('Failed to cancel task:', err);
    }
  },

  connectWebSocket: (taskId: string) => {
    const wsBase = import.meta.env.VITE_WS_URL || window.location.origin.replace('http', 'ws');
    const ws = new WebSocket(`${wsBase}/ws/tasks/${taskId}`);

    ws.onopen = () => {
      console.log(`WebSocket connected for task ${taskId}`);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as AgentEvent;
        get().addAgentEvent(data);

        if (data.event_type === 'task_completed') {
          get().loadTask(taskId);
          get().disconnectWebSocket();

          const resultMessage: ChatMessage = {
            id: crypto.randomUUID(),
            role: 'assistant',
            content: data.message || 'Task completed!',
            taskId,
            timestamp: new Date().toISOString(),
          };

          set((state) => ({
            messages: [...state.messages, resultMessage],
            isProcessing: false,
          }));
        }

        if (data.event_type === 'task_error') {
          get().disconnectWebSocket();
          const errorMessage: ChatMessage = {
            id: crypto.randomUUID(),
            role: 'system',
            content: data.message || 'Task failed',
            taskId,
            timestamp: new Date().toISOString(),
          };
          set((state) => ({
            messages: [...state.messages, errorMessage],
            isProcessing: false,
          }));
        }
      } catch {
        console.error('Failed to parse WebSocket message');
      }
    };

    ws.onerror = (err) => {
      console.error('WebSocket error:', err);
    };

    ws.onclose = () => {
      console.log('WebSocket disconnected');
    };

    set({ wsConnection: ws });
  },

  disconnectWebSocket: () => {
    const ws = get().wsConnection;
    if (ws) {
      ws.close();
      set({ wsConnection: null });
    }
  },

  addAgentEvent: (event: AgentEvent) => {
    set((state) => ({
      agentEvents: [...state.agentEvents, event],
    }));
  },

  clearChat: () => {
    get().disconnectWebSocket();
    set({
      messages: [],
      currentTask: null,
      agentEvents: [],
      isProcessing: false,
    });
  },
}));

// Poll task status as WebSocket fallback
function pollTaskStatus(
  taskId: string,
  set: any,
  get: () => ChatState,
  interval = 3000,
  maxAttempts = 100
) {
  let attempts = 0;

  const poll = async () => {
    if (attempts >= maxAttempts || !get().isProcessing) return;
    attempts++;

    try {
      const task = await api.getTask(taskId);
      set({ currentTask: task });

      if (task.status === 'complete' || task.status === 'error') {
        get().disconnectWebSocket();

        const message: ChatMessage = {
          id: crypto.randomUUID(),
          role: task.status === 'complete' ? 'assistant' : 'system',
          content: task.result || task.error_message || `Task ${task.status}`,
          taskId,
          timestamp: new Date().toISOString(),
        };

        set((state: ChatState) => ({
          messages: [...state.messages, message],
          isProcessing: false,
        }));
        return;
      }
    } catch {
      // Ignore polling errors
    }

    setTimeout(poll, interval);
  };

  setTimeout(poll, interval);
}
