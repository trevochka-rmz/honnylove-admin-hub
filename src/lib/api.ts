import type { AuthResponse, ProductsResponse, Product, BrandsResponse, CategoriesResponse, ProductFilters, BrandDetail, CategoryDetail, CategoryDetailResponse, CreateCategoryResponse, User } from '@/types';

const API_BASE = `${import.meta.env.VITE_API_BASE_URL}/api`;

class ApiClient {
  private accessToken: string | null = null;
  private refreshToken: string | null = null;

  constructor() {
    this.accessToken = localStorage.getItem('accessToken');
    this.refreshToken = localStorage.getItem('refreshToken');
  }

  setTokens(accessToken: string, refreshToken: string) {
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
  }

  clearTokens() {
    this.accessToken = null;
    this.refreshToken = null;
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
  }

  getAccessToken() {
    return this.accessToken;
  }

  private async refreshAccessToken(): Promise<boolean> {
    if (!this.refreshToken) return false;

    try {
      const response = await fetch(`${API_BASE}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: this.refreshToken }),
      });

      if (!response.ok) return false;

      const data = await response.json();
      this.accessToken = data.accessToken;
      localStorage.setItem('accessToken', data.accessToken);
      return true;
    } catch {
      return false;
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    requiresAuth = true
  ): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (requiresAuth && this.accessToken) {
      headers['Authorization'] = `Bearer ${this.accessToken}`;
    }

    let response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    if (response.status === 401 && requiresAuth) {
      const refreshed = await this.refreshAccessToken();
      if (refreshed) {
        headers['Authorization'] = `Bearer ${this.accessToken}`;
        response = await fetch(`${API_BASE}${endpoint}`, {
          ...options,
          headers,
        });
      } else {
        this.clearTokens();
        window.location.href = '/login';
        throw new Error('Session expired');
      }
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Request failed' }));
      throw new Error(error.error || error.message || 'Request failed');
    }

    return response.json();
  }

  async login(email: string, password: string): Promise<AuthResponse> {
    const response = await this.request<AuthResponse>(
      '/auth/admin/login',
      {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      },
      false
    );

    this.setTokens(response.accessToken, response.refreshToken);
    localStorage.setItem('user', JSON.stringify(response.user));
    return response;
  }

  async getProducts(filters: ProductFilters = {}): Promise<ProductsResponse> {
    const params = new URLSearchParams();
    
    if (filters.limit) params.append('limit', filters.limit.toString());
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.brandId) params.append('brandId', filters.brandId.toString());
    if (filters.categoryId) params.append('categoryId', filters.categoryId.toString());
    if (filters.minPrice) params.append('minPrice', filters.minPrice.toString());
    if (filters.maxPrice) params.append('maxPrice', filters.maxPrice.toString());
    if (filters.isFeatured) params.append('isFeatured', 'true');
    if (filters.isNew) params.append('isNew', 'true');
    if (filters.isBestseller) params.append('isBestseller', 'true');
    if (filters.isOnSale) params.append('isOnSale', 'true');
    if (filters.sort) params.append('sort', filters.sort);

    const query = params.toString();
    return this.request<ProductsResponse>(`/products/admin/all${query ? `?${query}` : ''}`);
  }

  async getProduct(id: string): Promise<Product> {
    return this.request<Product>(`/products/admin/${id}`);
  }

  async updateProduct(id: string, data: Partial<Product>): Promise<Product> {
    return this.request<Product>(`/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async createProduct(data: {
    name: string;
    purchase_price: number;
    retail_price: number;
    brand_id: number;
    category_id: number;
    product_type: string;
    stockQuantity?: number;
  }): Promise<Product> {
    return this.request<Product>('/products', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getProfile(): Promise<User> {
    return this.request<User>('/users/profile');
  }

  async getBrands(): Promise<BrandsResponse> {
    return this.request<BrandsResponse>('/brands/brief', {}, false);
  }

  async getBrand(id: number): Promise<BrandDetail> {
    return this.request<BrandDetail>(`/brands/${id}`, {}, false);
  }

  async createBrand(data: {
    name: string;
    description?: string;
    website?: string;
    is_active?: boolean;
    full_description?: string;
    country?: string;
    founded?: string;
    philosophy?: string;
    highlights?: string[];
  }): Promise<BrandDetail> {
    return this.request<BrandDetail>('/brands/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateBrand(id: number, data: Partial<{
    name: string;
    description: string;
    website: string;
    is_active: boolean;
    full_description: string;
    country: string;
    founded: string;
    philosophy: string;
    highlights: string[];
  }>): Promise<BrandDetail> {
    return this.request<BrandDetail>(`/brands/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteBrand(id: number): Promise<void> {
    return this.request<void>(`/brands/${id}`, {
      method: 'DELETE',
    });
  }

  async getCategories(): Promise<CategoriesResponse> {
    return this.request<CategoriesResponse>('/categories/all', {}, false);
  }

  async getCategory(id: number): Promise<CategoryDetailResponse> {
    return this.request<CategoryDetailResponse>(`/categories/${id}`, {}, false);
  }

  async createCategory(data: {
    name: string;
    parent_id?: number;
    description?: string;
    is_active?: boolean;
  }): Promise<CreateCategoryResponse> {
    return this.request<CreateCategoryResponse>('/categories', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateCategory(id: number, data: Partial<{
    name: string;
    parent_id: number | null;
    description: string;
    is_active: boolean;
    display_order: number;
  }>): Promise<CategoryDetailResponse> {
    return this.request<CategoryDetailResponse>(`/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteCategory(id: number): Promise<void> {
    return this.request<void>(`/categories/${id}`, {
      method: 'DELETE',
    });
  }
}

export const api = new ApiClient();
