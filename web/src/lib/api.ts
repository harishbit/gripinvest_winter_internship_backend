import { User, AuthResponse, SignupData, LoginData, GetMeResponse, UpdateProfileData, UpdateProfileResponse } from '@/types/auth';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

class ApiClient {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    // Ensure we're using absolute URLs
    const url = endpoint.startsWith('http') ? endpoint : `${this.baseURL}${endpoint}`;
    
    // Check for admin token first, then regular token
    const adminToken = localStorage.getItem('adminToken');
    const token = adminToken || localStorage.getItem('token');

    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    };

    const response = await fetch(url, config);

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Network error' }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    return response.json();
  }

  // Auth endpoints
  async signup(data: SignupData): Promise<AuthResponse> {
    return this.request<AuthResponse>('/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async login(data: LoginData): Promise<AuthResponse> {
    return this.request<AuthResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getMe(): Promise<GetMeResponse> {
    return this.request<GetMeResponse>('/api/auth/me');
  }

  async updateProfile(data: UpdateProfileData): Promise<UpdateProfileResponse> {
    return this.request<UpdateProfileResponse>('/api/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // Product endpoints
  async getProducts(params?: {
    type?: string;
    riskLevel?: string;
    sortBy?: string;
    sortOrder?: string;
  }) {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value) searchParams.append(key, value);
      });
    }
    const query = searchParams.toString();
    return this.request(`/api/products${query ? `?${query}` : ''}`);
  }

  async getProduct(id: string) {
    return this.request(`/api/products/${id}`);
  }

  // Investment endpoints
  async getInvestments() {
    return this.request('/api/investments');
  }

  async createInvestment(data: { productId: string; amount: number }) {
    return this.request('/api/investments', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Log endpoints
  async getLogs(params?: { limit?: number; offset?: number }) {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) searchParams.append(key, value.toString());
      });
    }
    const query = searchParams.toString();
    return this.request(`/api/logs${query ? `?${query}` : ''}`);
  }

  // Health endpoint
  async getHealth() {
    return this.request('/api/health');
  }

  // Admin endpoints (requires admin token)
  async createProduct(data: {
    name: string;
    investmentType: 'bond' | 'fd' | 'mf' | 'etf' | 'other';
    tenureMonths: number;
    annualYield: number;
    riskLevel: 'low' | 'moderate' | 'high';
    minInvestment: number;
    maxInvestment?: number;
    description?: string;
  }) {
    return this.request('/api/products', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async deleteProduct(id: string) {
    return this.request(`/api/products/${id}`, {
      method: 'DELETE',
    });
  }

  // Admin authentication methods
  async adminLogin(email: string, password: string) {
    const response = await this.request<{ token: string; user: any }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    
    // Store admin token separately
    this.setAdminToken(response.token);
    return response;
  }

  setAdminToken(token: string) {
    localStorage.setItem('adminToken', token);
  }

  getAdminToken(): string | null {
    return localStorage.getItem('adminToken');
  }

  removeAdminToken() {
    localStorage.removeItem('adminToken');
  }

  isAdminAuthenticated(): boolean {
    return !!this.getAdminToken();
  }
}

export const apiClient = new ApiClient(API_BASE_URL);
