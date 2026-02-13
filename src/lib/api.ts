import type { AuthResponse, ProductsResponse, Product, BrandsResponse, CategoriesResponse, ProductFilters, BrandDetail, CategoryDetailResponse, CreateCategoryResponse, User, BlogsResponse, BlogPost, Order, OrdersResponse, OrderFilters, OrderStatusesResponse, BrandFilters } from '@/types';

const API_BASE = `${import.meta.env.VITE_API_BASE_URL}/api`;

class ApiClient {
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private refreshInFlight: Promise<boolean> | null = null;
  private autoRefreshIntervalId: number | null = null;

  private getCookie(name: string): string | null {
    const match = document.cookie.match(new RegExp('(?:^|; )' + name.replace(/([.$?*|{}()[\]\\/+^])/g, '\\$1') + '=([^;]*)'));
    return match ? decodeURIComponent(match[1]) : null;
  }

  private setCookie(name: string, value: string, days = 30) {
    const expires = new Date(Date.now() + days * 864e5).toUTCString();
    document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
  }

  private removeCookie(name: string) {
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; SameSite=Lax`;
  }

  constructor() {
    this.accessToken = this.getCookie('accessToken');
    this.refreshToken = this.getCookie('refreshToken');

    // Keep sessions alive (accessToken expires ~10-15 min)
    if (this.accessToken && this.refreshToken) {
      this.startAutoRefresh();
    }
  }

  private isJwtExpiringSoon(token: string | null, withinSeconds = 120): boolean {
    if (!token) return true;
    try {
      const [, payloadBase64] = token.split('.');
      if (!payloadBase64) return true;

      const normalized = payloadBase64.replace(/-/g, '+').replace(/_/g, '/');
      const payloadJson = atob(normalized);
      const payload = JSON.parse(payloadJson) as { exp?: number };
      if (!payload.exp) return true;

      const expiresAtMs = payload.exp * 1000;
      return Date.now() >= expiresAtMs - withinSeconds * 1000;
    } catch {
      return true;
    }
  }

  startAutoRefresh(opts: { checkIntervalMs?: number; refreshWithinSeconds?: number } = {}) {
    const checkIntervalMs = opts.checkIntervalMs ?? 60_000;
    const refreshWithinSeconds = opts.refreshWithinSeconds ?? 120;

    if (this.autoRefreshIntervalId) {
      window.clearInterval(this.autoRefreshIntervalId);
      this.autoRefreshIntervalId = null;
    }

    if (!this.refreshToken) return;

    this.autoRefreshIntervalId = window.setInterval(async () => {
      if (!this.refreshToken) return;
      if (!this.isJwtExpiringSoon(this.accessToken, refreshWithinSeconds)) return;

      const ok = await this.refreshAccessToken();
      if (!ok) {
        this.clearTokens();
        window.location.href = '/login';
      }
    }, checkIntervalMs);
  }

  stopAutoRefresh() {
    if (this.autoRefreshIntervalId) {
      window.clearInterval(this.autoRefreshIntervalId);
      this.autoRefreshIntervalId = null;
    }
  }

  setTokens(accessToken: string, refreshToken: string) {
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
    this.setCookie('accessToken', accessToken);
    this.setCookie('refreshToken', refreshToken);
    this.startAutoRefresh();
  }

  clearTokens() {
    this.stopAutoRefresh();
    this.accessToken = null;
    this.refreshToken = null;
    this.removeCookie('accessToken');
    this.removeCookie('refreshToken');
    this.removeCookie('user');
  }

  getAccessToken() {
    return this.accessToken;
  }

  private async refreshAccessToken(): Promise<boolean> {
    if (!this.refreshToken) return false;

    if (this.refreshInFlight) return this.refreshInFlight;

    this.refreshInFlight = (async () => {
      try {
        const response = await fetch(`${API_BASE}/auth/refresh`, {
          method: 'POST',
          credentials: 'include',
        });

        if (!response.ok) return false;

        const data = await response.json();
        if (!data?.accessToken) return false;

        this.accessToken = data.accessToken;
        this.setCookie('accessToken', data.accessToken);
        if (data.refreshToken) {
          this.refreshToken = data.refreshToken;
          this.setCookie('refreshToken', data.refreshToken);
        }
        return true;
      } catch {
        return false;
      } finally {
        this.refreshInFlight = null;
      }
    })();

    return this.refreshInFlight;
  }

  async logout(): Promise<void> {
    try {
      await fetch(`${import.meta.env.VITE_API_BASE_URL}/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });
    } catch {
      // ignore
    }
    this.clearTokens();
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

    let response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
      credentials: 'include',
    });

    const shouldAttemptRefresh =
      requiresAuth &&
      !!this.refreshToken &&
      !!this.accessToken &&
      (response.status === 401 ||
        (response.status === 403 && this.isJwtExpiringSoon(this.accessToken, 0)));

    if (shouldAttemptRefresh) {
      const refreshed = await this.refreshAccessToken();
      if (refreshed) {
        response = await fetch(`${API_BASE}${endpoint}`, {
          ...options,
          headers,
          credentials: 'include',
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
    this.setCookie('user', JSON.stringify(response.user));
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
    if (filters.search) params.append('search', filters.search);

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
    attributes?: {
      ingredients?: string;
      usage?: string;
      variants?: { name: string; value: string }[];
    };
  }): Promise<Product> {
    return this.request<Product>('/products', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async deleteProduct(id: string): Promise<void> {
    const response = await fetch(`${API_BASE}/products/${id}`, {
      method: 'DELETE',
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Request failed' }));
      throw new Error(error.error || error.message || 'Request failed');
    }
  }

  async createProductWithImages(formData: FormData): Promise<Product> {
    const response = await fetch(`${API_BASE}/products`, {
      method: 'POST',
      credentials: 'include',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Request failed' }));
      throw new Error(error.error || error.message || 'Request failed');
    }

    return response.json();
  }

  async updateProductWithImages(id: string, formData: FormData): Promise<Product> {
    const response = await fetch(`${API_BASE}/products/${id}`, {
      method: 'PUT',
      credentials: 'include',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Request failed' }));
      throw new Error(error.error || error.message || 'Request failed');
    }

    return response.json();
  }

  async exportProductsCSV(): Promise<Blob> {
    const response = await fetch(`${API_BASE}/products/export/csv`, {
      method: 'GET',
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Export failed' }));
      throw new Error(error.error || error.message || 'Export failed');
    }

    return response.blob();
  }

  async exportProductsPDF(): Promise<Blob> {
    const response = await fetch(`${API_BASE}/products/export/pdf`, {
      method: 'GET',
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Export failed' }));
      throw new Error(error.error || error.message || 'Export failed');
    }

    return response.blob();
  }

  async getBrandsBrief(): Promise<{ success: boolean; count: number; brands: { id: number; slug: string; name: string; logo: string }[] }> {
    return this.request<{ success: boolean; count: number; brands: { id: number; slug: string; name: string; logo: string }[] }>('/brands/brief', {}, false);
  }

  async getProfile(): Promise<User> {
    return this.request<User>('/users/profile');
  }

  async getBrands(filters: BrandFilters = {}): Promise<BrandsResponse> {
    const params = new URLSearchParams();
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());
    if (filters.search) params.append('search', filters.search);
    if (filters.filter) params.append('filter', filters.filter);

    const query = params.toString();
    return this.request<BrandsResponse>(`/brands${query ? `?${query}` : ''}`, {}, false);
  }

  async getBrand(id: number): Promise<BrandDetail> {
    return this.request<BrandDetail>(`/brands/${id}`, {}, false);
  }

  async createBrand(formData: FormData): Promise<BrandDetail> {
    const response = await fetch(`${API_BASE}/brands/`, {
      method: 'POST',
      credentials: 'include',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Request failed' }));
      throw new Error(error.error || error.message || 'Request failed');
    }

    return response.json();
  }

  async updateBrand(id: number, formData: FormData): Promise<BrandDetail> {
    const response = await fetch(`${API_BASE}/brands/${id}`, {
      method: 'PUT',
      credentials: 'include',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Request failed' }));
      throw new Error(error.error || error.message || 'Request failed');
    }

    return response.json();
  }

  async deleteBrand(id: number): Promise<void> {
    const response = await fetch(`${API_BASE}/brands/${id}`, {
      method: 'DELETE',
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Request failed' }));
      throw new Error(error.error || error.message || 'Request failed');
    }
  }

  async getCategories(): Promise<CategoriesResponse> {
    return this.request<CategoriesResponse>('/categories/all', {}, false);
  }

  async getCategory(id: number): Promise<CategoryDetailResponse> {
    return this.request<CategoryDetailResponse>(`/categories/${id}`, {}, false);
  }

  async createCategory(formData: FormData): Promise<CreateCategoryResponse> {
    const response = await fetch(`${API_BASE}/categories`, {
      method: 'POST',
      credentials: 'include',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Request failed' }));
      throw new Error(error.error || error.message || 'Request failed');
    }

    return response.json();
  }

  async updateCategory(id: number, formData: FormData): Promise<CategoryDetailResponse> {
    const response = await fetch(`${API_BASE}/categories/${id}`, {
      method: 'PUT',
      credentials: 'include',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Request failed' }));
      throw new Error(error.error || error.message || 'Request failed');
    }

    return response.json();
  }

  async deleteCategory(id: number): Promise<void> {
    const response = await fetch(`${API_BASE}/categories/${id}`, {
      method: 'DELETE',
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Request failed' }));
      throw new Error(error.error || error.message || 'Request failed');
    }
  }

  async getBlogs(params: { limit?: number; page?: number; search?: string } = {}): Promise<BlogsResponse> {
    const qs = new URLSearchParams();
    if (params.limit) qs.append('limit', params.limit.toString());
    if (params.page) qs.append('page', params.page.toString());
    if (params.search) qs.append('search', params.search);

    const query = qs.toString();
    return this.request<BlogsResponse>(`/blogs${query ? `?${query}` : ''}`, {}, false);
  }

  async getBlog(id: string): Promise<BlogPost> {
    return this.request<BlogPost>(`/blogs/${id}`, {}, false);
  }

  async createBlog(formData: FormData): Promise<BlogPost> {
    const response = await fetch(`${API_BASE}/blogs/`, {
      method: 'POST',
      credentials: 'include',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Request failed' }));
      throw new Error(error.error || error.message || 'Request failed');
    }

    return response.json();
  }

  async updateBlog(id: string, formData: FormData): Promise<BlogPost> {
    const response = await fetch(`${API_BASE}/blogs/${id}`, {
      method: 'PUT',
      credentials: 'include',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Request failed' }));
      throw new Error(error.error || error.message || 'Request failed');
    }

    return response.json();
  }

  async deleteBlog(id: string): Promise<void> {
    const response = await fetch(`${API_BASE}/blogs/${id}`, {
      method: 'DELETE',
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Request failed' }));
      throw new Error(error.error || error.message || 'Request failed');
    }
  }

  async getUsers(): Promise<User[]> {
    return this.request<User[]>('/users');
  }

  async getUser(id: number): Promise<User> {
    return this.request<User>(`/users/${id}`);
  }

  // Orders
  async getOrderStatuses(): Promise<OrderStatusesResponse> {
    return this.request<OrderStatusesResponse>('/orders/statuses', {}, false);
  }

  async getOrders(filters: OrderFilters = {}): Promise<OrdersResponse> {
    const params = new URLSearchParams();
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());
    if (filters.status) params.append('status', filters.status);
    if (filters.user_id) params.append('user_id', filters.user_id.toString());
    if (filters.date_from) params.append('date_from', filters.date_from);
    if (filters.date_to) params.append('date_to', filters.date_to);
    if (filters.search) params.append('search', filters.search);

    const query = params.toString();
    return this.request<OrdersResponse>(`/orders/admin/orders${query ? `?${query}` : ''}`);
  }

  async getOrder(id: number): Promise<Order> {
    const response = await this.request<{ success: boolean; order: Order }>(`/orders/${id}`);
    return response.order;
  }

  async createOrder(data: {
    user_id: number;
    items: { product_id: number; quantity: number }[];
    shipping_address: string;
    payment_method: string;
    notes?: string;
    shipping_cost?: number;
    tax_amount?: number;
    discount_amount?: number;
    tracking_number?: string;
  }): Promise<Order> {
    const response = await this.request<{ success: boolean; order: Order }>('/orders/admin/orders', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.order;
  }

  async updateOrder(id: number, data: Partial<{
    shipping_address: string;
    payment_method: string;
    shipping_cost: number;
    tax_amount: number;
    discount_amount: number;
    tracking_number: string;
    notes: string;
  }>): Promise<Order> {
    const response = await this.request<{ success: boolean; order: Order }>(`/orders/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return response.order;
  }

  async deleteOrder(id: number): Promise<void> {
    await this.request<{ success: boolean }>(`/orders/${id}`, {
      method: 'DELETE',
    });
  }

  async addOrderItem(orderId: number, data: { product_id: number; quantity: number }): Promise<void> {
    await this.request<{ success: boolean }>(`/orders/admin/orders/${orderId}/items`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async removeOrderItem(orderId: number, itemId: number): Promise<void> {
    await this.request<{ success: boolean }>(`/orders/admin/orders/${orderId}/items/${itemId}`, {
      method: 'DELETE',
    });
  }

  // Banners
  async getBanners(): Promise<any[]> {
    return this.request<any[]>('/banners', {}, false);
  }

  async createBanner(formData: FormData): Promise<any> {
    const response = await fetch(`${API_BASE}/banners/`, {
      method: 'POST',
      credentials: 'include',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Request failed' }));
      throw new Error(error.error || error.message || 'Request failed');
    }

    return response.json();
  }

  async updateBanner(id: number, formData: FormData): Promise<any> {
    const response = await fetch(`${API_BASE}/banners/${id}`, {
      method: 'PUT',
      credentials: 'include',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Request failed' }));
      throw new Error(error.error || error.message || 'Request failed');
    }

    return response.json();
  }

  async deleteBanner(id: number): Promise<void> {
    const response = await fetch(`${API_BASE}/banners/${id}`, {
      method: 'DELETE',
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Request failed' }));
      throw new Error(error.error || error.message || 'Request failed');
    }
  }

  async getBlogTags(): Promise<string[]> {
    return this.request<string[]>('/blogs/tags/all', {}, false);
  }

  // POS
  async posPreview(productIds: number[]): Promise<any> {
    return this.request<any>('/pos/preview', {
      method: 'POST',
      body: JSON.stringify({ product_ids: productIds }),
    });
  }

  async posCheckout(data: {
    items: { product_id: number; quantity: number }[];
    payment_method: string;
    customer_name?: string;
    customer_phone?: string;
    notes?: string;
  }): Promise<any> {
    return this.request<any>('/pos/checkout', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async posGetOrders(filters: {
    status?: string;
    payment_method?: string;
    created_by?: number;
    date_from?: string;
    date_to?: string;
    today_only?: boolean;
    this_week?: boolean;
    this_month?: boolean;
    search?: string;
    is_pos_order?: boolean;
    page?: number;
    limit?: number;
  } = {}): Promise<any> {
    const params = new URLSearchParams();
    if (filters.status) params.append('status', filters.status);
    if (filters.payment_method) params.append('payment_method', filters.payment_method);
    if (filters.created_by) params.append('created_by', filters.created_by.toString());
    if (filters.date_from) params.append('date_from', filters.date_from);
    if (filters.date_to) params.append('date_to', filters.date_to);
    if (filters.today_only) params.append('today_only', 'true');
    if (filters.this_week) params.append('this_week', 'true');
    if (filters.this_month) params.append('this_month', 'true');
    if (filters.search) params.append('search', filters.search);
    if (filters.is_pos_order) params.append('is_pos_order', 'true');
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());
    const query = params.toString();
    return this.request<any>(`/pos/orders${query ? `?${query}` : ''}`);
  }

  async posGetStatistics(filters: {
    date_from?: string;
    date_to?: string;
    today_only?: boolean;
    this_week?: boolean;
    this_month?: boolean;
    cashier_id?: number;
    is_pos_order?: boolean;
  } = {}): Promise<any> {
    const params = new URLSearchParams();
    if (filters.date_from) params.append('date_from', filters.date_from);
    if (filters.date_to) params.append('date_to', filters.date_to);
    if (filters.today_only) params.append('today_only', 'true');
    if (filters.this_week) params.append('this_week', 'true');
    if (filters.this_month) params.append('this_month', 'true');
    if (filters.cashier_id) params.append('cashier_id', filters.cashier_id.toString());
    if (filters.is_pos_order) params.append('is_pos_order', 'true');
    const query = params.toString();
    return this.request<any>(`/pos/statistics${query ? `?${query}` : ''}`);
  }

  async posToday(): Promise<any> {
    return this.request<any>('/pos/today');
  }

  async posThisWeek(): Promise<any> {
    return this.request<any>('/pos/this-week');
  }

  async posThisMonth(): Promise<any> {
    return this.request<any>('/pos/this-month');
  }

  async posGetCashiers(): Promise<any> {
    return this.request<any>('/pos/cashiers');
  }

  async posUpdateOrder(orderId: number, data: {
    payment_method?: string;
    discount_amount?: number;
    customer_name?: string;
    customer_phone?: string;
    notes?: string;
  }): Promise<any> {
    return this.request<any>(`/pos/orders/${orderId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async posDeleteOrder(orderId: number): Promise<any> {
    return this.request<any>(`/pos/orders/${orderId}`, {
      method: 'DELETE',
    });
  }
}


export const api = new ApiClient();
