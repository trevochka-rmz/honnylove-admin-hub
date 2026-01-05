export interface User {
  id: number;
  username: string;
  email: string;
  role: string;
  first_name: string;
  last_name: string;
  phone: string;
  address: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  slug: string;
  purchasePrice: string;
  price: string;
  discountPrice: string | null;
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

export interface BrandsResponse {
  success: boolean;
  count: number;
  brands: Brand[];
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
}
