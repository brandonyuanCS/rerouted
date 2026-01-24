const API_BASE_URL = 'http://localhost:3001/api';

interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
}

class ApiService {
  private baseUrl: string;
  private authToken: string | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  setAuthToken(token: string) {
    this.authToken = token;
  }

  clearAuthToken() {
    this.authToken = null;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...(this.authToken && { Authorization: `Bearer ${this.authToken}` }),
      ...options.headers,
    };

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Request failed');
      }

      return { data, success: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return { data: null as T, success: false, message };
    }
  }

  // Auth endpoints
  async login(employeeId: string, password: string) {
    return this.request('/crew/login', {
      method: 'POST',
      body: JSON.stringify({ employeeId, password }),
    });
  }

  async logout() {
    return this.request('/crew/logout', { method: 'POST' });
  }

  // Crew endpoints
  async getProfile() {
    return this.request('/crew/profile');
  }

  async updateLocation(location: { airport: string; terminal: string }) {
    return this.request('/crew/location', {
      method: 'PUT',
      body: JSON.stringify(location),
    });
  }

  async getDutyStatus() {
    return this.request('/crew/duty-status');
  }

  // Assignment endpoints
  async getAssignments() {
    return this.request('/crew/assignments');
  }

  async getPendingOffers() {
    return this.request('/crew/assignments/pending');
  }

  async acceptAssignment(assignmentId: string) {
    return this.request(`/crew/assignments/${assignmentId}/accept`, {
      method: 'POST',
    });
  }

  async declineAssignment(assignmentId: string) {
    return this.request(`/crew/assignments/${assignmentId}/decline`, {
      method: 'POST',
    });
  }

  // Schedule endpoints
  async getSchedule() {
    return this.request('/crew/schedule');
  }
}

export const api = new ApiService(API_BASE_URL);
export default api;
