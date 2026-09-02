import {
  User,
  Conversation,
  Message,
  Contact,
  ErrorLog,
  PaginatedResponse,
  LoginRequest,
  LoginResponse,
  SearchResultItem,
} from '@/types';
import {
  MOCK_CONTACTS,
  MOCK_ERRORS,
  MOCK_USERS,
} from './mockData';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
const USE_MOCK = false;

class ApiClient {
  private async fetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${BASE_URL}${endpoint}`;
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...((options.headers as Record<string, string>) || {}),
    };

    const res = await fetch(url, {
      ...options,
      headers: {
        ...headers,
        'Cache-Control': 'no-cache',
      },
      cache: 'no-store',
      credentials: 'include',
      signal: AbortSignal.timeout(10000),
    });

    if (res.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
      if (!window.location.pathname.startsWith('/login')) {
        window.location.href = '/login';
      }
    }

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({ message: res.statusText }));
      throw new Error(errorData.message || errorData.detail || `Request failed with status ${res.status}`);
    }

    return res.json();
  }

  // Authentication
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const res = await this.fetch<LoginResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    if (res.token && typeof window !== 'undefined') {
      localStorage.setItem('auth_token', res.token);
    }
    return res;
  }

  async logout(): Promise<void> {
    try {
      await this.fetch('/api/auth/logout', { method: 'POST' });
    } finally {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth_token');
        window.location.href = '/login';
      }
    }
  }

  async getCurrentUser(): Promise<User | null> {
    try {
      const res = await this.fetch<{ user: User | null }>('/api/auth/me');
      return res.user;
    } catch {
      return null;
    }
  }

  // Conversations
  async getConversations(page = 1, limit = 50): Promise<PaginatedResponse<Conversation>> {
    return await this.fetch<PaginatedResponse<Conversation>>(`/api/conversations?page=${page}&limit=${limit}`);
  }

  async getConversation(id: number): Promise<{ conversation: Conversation; messages: Message[] }> {
    return await this.fetch<{ conversation: Conversation; messages: Message[] }>(`/api/conversations/${id}`);
  }

  // Search & Filter
  async search(query: string, fromDate?: string, toDate?: string, page = 1): Promise<PaginatedResponse<SearchResultItem>> {
    const params = new URLSearchParams({ page: String(page), limit: '50' });
    if (query) params.set('q', query);
    if (fromDate) params.set('from', fromDate);
    if (toDate) params.set('to', toDate);

    return this.fetch<PaginatedResponse<SearchResultItem>>(`/api/search?${params.toString()}`);
  }

  // Leads
  async getLeads(page = 1, limit = 50): Promise<PaginatedResponse<Contact>> {
    try {
      return await this.fetch<PaginatedResponse<Contact>>(`/api/leads?page=${page}&limit=${limit}`);
    } catch (err) {
      console.warn('Live backend fetch for leads failed, using fallback:', err);
      return {
        items: MOCK_CONTACTS,
        total: MOCK_CONTACTS.length,
        page,
        limit,
        total_pages: 1,
      };
    }
  }

  // Errors
  async getErrors(limit = 50): Promise<ErrorLog[]> {
    try {
      return await this.fetch<ErrorLog[]>(`/api/errors?limit=${limit}`);
    } catch (err) {
      console.warn('Live backend fetch for errors failed, using fallback:', err);
      return MOCK_ERRORS;
    }
  }

  // Users (Admin only)
  async getUsers(): Promise<User[]> {
    try {
      return await this.fetch<User[]>('/api/users');
    } catch (err) {
      console.warn('Live backend fetch for users failed, using fallback:', err);
      return MOCK_USERS;
    }
  }

  async createUser(data: { email: string; password?: string; role: string }): Promise<User> {
    return this.fetch<User>('/api/users', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateUser(id: number, data: Partial<User>): Promise<User> {
    return this.fetch<User>(`/api/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteUser(id: number): Promise<{ success: boolean }> {
    return this.fetch<{ success: boolean }>(`/api/users/${id}`, {
      method: 'DELETE',
    });
  }

  // Export URLs
  getExportUrl(type: 'csv' | 'xlsx'): string {
    return `${BASE_URL}/api/export/leads.${type}`;
  }
}

export const api = new ApiClient();
