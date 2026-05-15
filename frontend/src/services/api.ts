/**
 * API service: centralized HTTP client with JWT interceptor.
 */

const API_BASE = import.meta.env.VITE_API_URL || '';

interface RequestOptions extends RequestInit {
  skipAuth?: boolean;
}

class ApiService {
  private getToken(): string | null {
    const authData = localStorage.getItem('auth-storage');
    if (!authData) return null;
    try {
      const parsed = JSON.parse(authData);
      return parsed?.state?.token || null;
    } catch {
      return null;
    }
  }

  private async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const { skipAuth = false, headers: customHeaders, ...rest } = options;
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...Object.fromEntries(new Headers(customHeaders).entries()),
    };

    if (!skipAuth) {
      const token = this.getToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }

    const response = await fetch(`${API_BASE}${endpoint}`, {
      headers,
      ...rest,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const error = new Error(errorData.detail || `HTTP ${response.status}`);
      (error as any).status = response.status;
      (error as any).data = errorData;
      throw error;
    }

    return response.json();
  }

  // Auth
  async register(email: string, username: string, password: string) {
    return this.request<any>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, username, password }),
      skipAuth: true,
    });
  }

  async login(email: string, password: string) {
    return this.request<any>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
      skipAuth: true,
    });
  }

  async getMe() {
    return this.request<any>('/api/auth/me');
  }

  // Tasks
  async createTask(inputText: string, title?: string) {
    return this.request<any>('/api/tasks', {
      method: 'POST',
      body: JSON.stringify({ input_text: inputText, title }),
    });
  }

  async getTask(taskId: string) {
    return this.request<any>(`/api/tasks/${taskId}`);
  }

  async listTasks(page = 1, pageSize = 20, status?: string) {
    const params = new URLSearchParams({
      page: String(page),
      page_size: String(pageSize),
    });
    if (status) params.set('status', status);
    return this.request<any>(`/api/tasks?${params}`);
  }

  async cancelTask(taskId: string) {
    return this.request<any>(`/api/tasks/${taskId}`, {
      method: 'DELETE',
    });
  }

  // Analytics
  async getAnalytics() {
    return this.request<any>('/api/analytics');
  }

  // Health
  async healthCheck() {
    return this.request<any>('/api/health', { skipAuth: true });
  }
}

export const api = new ApiService();
