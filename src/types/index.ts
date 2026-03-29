export interface User {
  id: number;
  username: string;
  email: string;
  role: string | null;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  address: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  discount_percentage?: string;
  totalUsers?: number;
  activeOrdersCount?: number;
}

export interface OrderItem {
  id: number;
  product_id: number;
  product_name: string;
  product_sku: string;
  product_image: string;
  product_description: string;
  quantity: number;
  price: number;
  discount_price: number | null;
  line_total: number;
  created_at: string;
}

export interface OrderStatusHistory {
  id: number;
  status: string;
  created_at: string;
  changed_by_user_id: number;
  changed_by_email: string;
  changed_by_name: string;
}

export interface Order {
  id: number;
  user_id: number;
  status: string;
  total_amount: string;
  shipping_address: string | null;
  payment_method: string;
  created_at: string;
  updated_at: string;
  shipping_cost: string;
  tax_amount: string;
  discount_amount: string;
  tracking_number: string | null;
  notes: string | null;
  user_email: string;
  user_first_name?: string | null;
  user_last_name?: string | null;
  user_phone?: string | null;
  user_default_address?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  items_count: string;
  total_quantity?: string | null;
  total_items_quantity?: string | null;
  items?: OrderItem[];
  status_history?: OrderStatusHistory[];
}

export interface OrdersResponse {
  success: boolean;
  orders: Order[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasMore: boolean;
  };
}

export interface OrderFilters {
  page?: number;
  limit?: number;
  status?: string;
  user_id?: number;
  date_from?: string;
  date_to?: string;
  search?: string;
}

export interface OrderStatusesResponse {
  success: boolean;
  data: {
    statuses: string[];
    descriptions: Record<string, string>;
    cancellable: string[];
    deletable: string[];
  };
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface StockVariant {
  id: number;
  sku: string | null;
  name: string;
  image: string;
  images: string[];
  isNew: boolean;
  price: number;
  priceKg: number | null;
  inStock: boolean;
  options: Record<string, string>;
  isActive: boolean;
  sortOrder: number;
  isFeatured: boolean;
  isAvailable: boolean;
  isBestseller: boolean;
  discountPrice: number | null;
  discountPriceKg: number | null;
  stockQuantity: number;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  slug: string;
  purchasePrice: string;
  price: string;
  discountPrice: string | null;
  priceKg: string | null;
  discountPriceKg: string | null;
  brand: string;
  brand_id: number;
  brand_slug: string;
  top_category_name: string;
  top_category_id: number;
  top_category_slug: string;
  parent_category_name: string;
  parent_category_id: number;
  parent_category_slug: string;
  category_name: string;
  category_id: number;
  category_slug: string;
  category_level: number;
  subcategory: string;
  subcategory_id: number;
  image: string;
  images: string[];
  ingredients: string;
  usage: string;
  variants: { name: string; value: string }[];
  inStock: boolean;
  isNew: boolean;
  isBestseller: boolean;
  isFeatured: boolean;
  isActive: boolean;
  rating: string;
  reviewCount: number;
  created_at: string;
  updated_at: string;
  sku: string;
  product_type: string;
  target_audience: string;
  skin_type: string;
  supplier_id: number;
  weight_grams: number | null;
  length_cm: number | null;
  width_cm: number | null;
  height_cm: number | null;
  meta_title: string | null;
  meta_description: string | null;
  stockQuantity: number | null;
  stockVariants: StockVariant[];
}

export interface ProductsResponse {
  products: Product[];
  total: number;
  page: number;
  pages: number;
  limit: number;
  hasMore: boolean;
}

export interface Brand {
  id: number;
  slug: string;
  name: string;
  logo: string;
}

export interface BrandDetail {
  id: number;
  slug: string;
  name: string;
  logo: string;
  description: string | null;
  fullDescription: string | null;
  country: string | null;
  founded: string | null;
  philosophy: string | null;
  highlights: string[];
  productsCount: string;
  website?: string;
  is_active?: boolean;
}

export interface BrandListItem {
  id: number;
  name: string;
  logo: string;
  description: string | null;
  fullDescription: string | null;
  country: string | null;
  founded: string | null;
  philosophy: string | null;
  highlights: string[];
  productsCount: string;
  isFeatured: boolean;
  slug: string;
}

export interface BrandsResponse {
  brands: BrandListItem[];
  total: number;
  page: number;
  pages: number;
  limit: number;
  hasMore: boolean;
}

export interface BrandFilters {
  page?: number;
  limit?: number;
  search?: string;
  filter?: 'popular' | 'new' | 'recommended';
}

export interface CategoryDetail {
  id: number;
  name: string;
  slug: string;
  image_url: string;
  display_order: number;
  parent_id: number | null;
  level: number;
  description: string | null;
  is_active: boolean;
  product_count: number;
  children: {
    id: number;
    name: string;
    slug: string;
    image_url: string;
    display_order: number;
    level: number;
    product_count: number;
  }[];
}

export interface CategoryDetailResponse {
  success: boolean;
  data: CategoryDetail;
}

export interface CreateCategoryResponse {
  success: boolean;
  message: string;
  data: CategoryDetail;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  image_url: string;
  display_order: number;
  product_count: string;
  children?: Category[];
}

export interface CategoriesResponse {
  success: boolean;
  data: Category[];
}

export interface ProductFilters {
  brandId?: number;
  categoryId?: number;
  minPrice?: number;
  maxPrice?: number;
  isFeatured?: boolean;
  isNew?: boolean;
  isBestseller?: boolean;
  isOnSale?: boolean;
  sort?: 'popularity' | 'price_asc' | 'price_desc' | 'rating' | 'newest';
  page?: number;
  limit?: number;
  search?: string;
}

export interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  image: string;
  category: string;
  author: string;
  date: string;
  read_time: number;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export interface BlogsResponse {
  posts: BlogPost[];
  total: number;
  page: number;
  pages: number;
  limit: number;
  hasMore: boolean;
}
