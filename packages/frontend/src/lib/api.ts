import { auth } from './auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

/**
 * API client configuration.
 */
interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | undefined>;
}

/**
 * API response wrapper.
 */
interface ApiResponse<T> {
  data: T;
  meta?: {
    total?: number;
    page?: number;
    pageSize?: number;
    hasMore?: boolean;
  };
}

/**
 * API error structure.
 */
interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

/**
 * API client class.
 */
class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async getAuthHeader(): Promise<Record<string, string>> {
    const session = await auth();
    if (session?.backendToken) {
      return { Authorization: `Bearer ${session.backendToken}` };
    }
    return {};
  }

  private buildUrl(path: string, params?: Record<string, string | number | undefined>): string {
    const url = new URL(`${this.baseUrl}/api${path}`);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          url.searchParams.set(key, String(value));
        }
      });
    }
    return url.toString();
  }

  async request<T>(path: string, options: RequestOptions = {}): Promise<ApiResponse<T>> {
    const { params, ...fetchOptions } = options;
    const url = this.buildUrl(path, params);
    const authHeaders = await this.getAuthHeader();

    const response = await fetch(url, {
      ...fetchOptions,
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders,
        ...fetchOptions.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: { code: 'UNKNOWN', message: 'Unknown error' } }));
      throw new ApiClientError(response.status, error.error);
    }

    return response.json();
  }

  async get<T>(path: string, params?: Record<string, string | number | undefined>): Promise<T> {
    const response = await this.request<T>(path, { method: 'GET', params });
    return response.data;
  }

  async post<T>(path: string, body?: unknown): Promise<T> {
    const response = await this.request<T>(path, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
    return response.data;
  }

  async patch<T>(path: string, body?: unknown): Promise<T> {
    const response = await this.request<T>(path, {
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    });
    return response.data;
  }

  async delete<T>(path: string): Promise<T> {
    const response = await this.request<T>(path, { method: 'DELETE' });
    return response.data;
  }
}

/**
 * API client error.
 */
export class ApiClientError extends Error {
  constructor(
    public status: number,
    public error: ApiError
  ) {
    super(error.message);
    this.name = 'ApiClientError';
  }
}

/**
 * Create typed API client.
 */
export const api = {
  client: new ApiClient(API_URL),

  // Auth
  auth: {
    me: () => api.client.get<{ id: string; email: string; name: string | null; image: string | null; roles: string[] }>('/auth/me'),
  },

  // Workspaces
  workspaces: {
    list: (params?: { search?: string; limit?: number; offset?: number }) =>
      api.client.get<Array<{
        id: string;
        name: string;
        slug: string;
        description: string | null;
        ownerId: string;
        settings: Record<string, unknown>;
        createdAt: string;
        updatedAt: string;
      }>>('/workspaces', params),

    get: (id: string) =>
      api.client.get<{
        id: string;
        name: string;
        slug: string;
        description: string | null;
        ownerId: string;
        settings: Record<string, unknown>;
        createdAt: string;
        updatedAt: string;
      }>(`/workspaces/${id}`),

    create: (data: { name: string; slug?: string; description?: string | null }) =>
      api.client.post<{
        id: string;
        name: string;
        slug: string;
        description: string | null;
        ownerId: string;
        settings: Record<string, unknown>;
        createdAt: string;
        updatedAt: string;
      }>('/workspaces', data),

    update: (id: string, data: { name?: string; description?: string | null }) =>
      api.client.patch<{
        id: string;
        name: string;
        slug: string;
        description: string | null;
        ownerId: string;
        settings: Record<string, unknown>;
        createdAt: string;
        updatedAt: string;
      }>(`/workspaces/${id}`, data),

    delete: (id: string) =>
      api.client.delete<{ success: boolean }>(`/workspaces/${id}`),

    getMembers: (id: string) =>
      api.client.get<Array<{
        workspaceId: string;
        userId: string;
        role: string;
        joinedAt: string;
        user: {
          id: string;
          name: string | null;
          email: string;
          image: string | null;
        };
      }>>(`/workspaces/${id}/members`),

    getStats: (id: string) =>
      api.client.request<{
        totalProjects: number;
        totalIssues: number;
        openIssues: number;
        closedIssues: number;
        issuesByPriority: Array<{ priority: string; count: number }>;
        issuesByAssignee: Array<{ userId: string; userName: string | null; userEmail: string; count: number }>;
        issuesByProject: Array<{ projectId: string; projectName: string; projectColor: string; count: number }>;
        recentIssues: Array<{ id: string; title: string; projectName: string; createdAt: string }>;
      }>(`/workspaces/${id}/stats`),
  },

  // Projects
  projects: {
    getStats: (projectId: string) =>
      api.client.request<{
        totalIssues: number;
        openIssues: number;
        closedIssues: number;
        issuesByStatus: Array<{ statusId: string; statusName: string; statusColor: string; count: number }>;
        issuesByPriority: Array<{ priority: string; count: number }>;
        issuesByLabel: Array<{ labelId: string; labelName: string; labelColor: string; count: number }>;
        issuesOverTime: Array<{ date: string; created: number; closed: number }>;
        recentActivity: Array<{ date: string; type: string; count: number }>;
      }>(`/projects/${projectId}/stats`),
  },
};

