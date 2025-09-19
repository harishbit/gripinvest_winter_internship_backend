const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// Re-export types for convenience
export interface Product {
  id: string;
  name: string;
  investmentType: string;
  tenureMonths: number;
  annualYield: number;
  riskLevel: string;
  minInvestment: number;
  maxInvestment?: number;
  description: string;
  createdAt: string;
}

export interface CreateProductData {
  name: string;
  investmentType: 'bond' | 'fd' | 'mf' | 'etf' | 'other';
  tenureMonths: number;
  annualYield: number;
  riskLevel: 'low' | 'moderate' | 'high';
  minInvestment: number;
  maxInvestment?: number;
  description?: string;
}

class AdminApiClient {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = endpoint.startsWith('http') ? endpoint : `${this.baseURL}${endpoint}`;
    const token = localStorage.getItem('adminToken');

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

  async login(email: string, password: string) {
    const response = await this.request<{ token: string; user: any }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    localStorage.setItem('adminToken', response.token);
    return response;
  }

  logout() {
    localStorage.removeItem('adminToken');
  }

  isAuthenticated(): boolean {
    return !!localStorage.getItem('adminToken');
  }

  async getProducts(): Promise<{ products: Product[] }> {
    return this.request<{ products: Product[] }>('/api/products');
  }

  async createProduct(data: CreateProductData) {
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
}

export const adminApiClient = new AdminApiClient(API_BASE_URL);
