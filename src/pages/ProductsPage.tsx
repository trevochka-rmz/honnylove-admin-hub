import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import type { Product, Brand, Category, ProductFilters } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import {
  Plus,
  Pencil,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  X,
  Loader2,
  Package,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function ProductsPage() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [products, setProducts] = useState<Product[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);

  const [filters, setFilters] = useState<ProductFilters>({
    page: 1,
    limit: 50,
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');

  useEffect(() => {
    Promise.all([api.getBrands(), api.getCategories()]).then(([brandsRes, categoriesRes]) => {
      setBrands(brandsRes.brands);
      setCategories(categoriesRes.data);
    });
  }, []);

  useEffect(() => {
    loadProducts();
  }, [filters]);

  const loadProducts = async () => {
    setIsLoading(true);
    try {
      const response = await api.getProducts(filters);
      setProducts(response.products);
      setTotal(response.total);
      setPages(response.pages);
    } catch (error) {
      toast({
        title: 'Ошибка загрузки',
        description: 'Не удалось загрузить товары',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFilterChange = (key: keyof ProductFilters, value: any) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value || undefined,
      page: 1,
    }));
  };

  const applyPriceFilter = () => {
    setFilters((prev) => ({
      ...prev,
      minPrice: minPrice ? Number(minPrice) : undefined,
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
      page: 1,
    }));
  };

  const clearFilters = () => {
    setFilters({ page: 1, limit: 50 });
    setSearchTerm('');
    setMinPrice('');
    setMaxPrice('');
  };

  const filteredProducts = searchTerm
    ? products.filter(
        (p) =>
          p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.brand?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : products;

  const flattenCategories = (cats: Category[], level = 0): { id: number; name: string; level: number }[] => {
    let result: { id: number; name: string; level: number }[] = [];
    for (const cat of cats) {
      result.push({ id: cat.id, name: cat.name, level });
      if (cat.children && cat.children.length > 0) {
        result = result.concat(flattenCategories(cat.children, level + 1));
      }
    }
    return result;
  };

  const flatCategories = flattenCategories(categories);

  const hasActiveFilters =
    filters.brandId ||
    filters.categoryId ||
    filters.minPrice ||
    filters.maxPrice ||
    filters.isFeatured ||
    filters.isNew ||
    filters.isBestseller ||
    filters.isOnSale ||
    filters.sort;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Товары</h1>
          <p className="text-muted-foreground">Всего {total} товаров</p>
        </div>
        <Button onClick={() => navigate('/products/new')}>
          <Plus className="mr-2 h-4 w-4" />
          Добавить товар
        </Button>
      </div>

      {/* Search & Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Поиск по названию, SKU или бренду..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Sort */}
            <Select
              value={filters.sort || ''}
              onValueChange={(value) => handleFilterChange('sort', value || undefined)}
            >
              <SelectTrigger className="w-full lg:w-48">
                <SelectValue placeholder="Сортировка" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">По новизне</SelectItem>
                <SelectItem value="popularity">По популярности</SelectItem>
                <SelectItem value="price_asc">Цена ↑</SelectItem>
                <SelectItem value="price_desc">Цена ↓</SelectItem>
                <SelectItem value="rating">По рейтингу</SelectItem>
              </SelectContent>
            </Select>

            {/* Filter Toggle */}
            <Button
              variant={showFilters ? 'secondary' : 'outline'}
              onClick={() => setShowFilters(!showFilters)}
              className="gap-2"
            >
              <Filter className="h-4 w-4" />
              Фильтры
              {hasActiveFilters && (
                <Badge variant="secondary" className="ml-1 bg-primary text-primary-foreground">
                  !
                </Badge>
              )}
            </Button>
          </div>

          {/* Expanded Filters */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-border space-y-4 animate-fade-in">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Brand Filter */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Бренд</label>
                  <Select
                    value={filters.brandId?.toString() || ''}
                    onValueChange={(value) =>
                      handleFilterChange('brandId', value ? Number(value) : undefined)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Все бренды" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Все бренды</SelectItem>
                      {brands.map((brand) => (
                        <SelectItem key={brand.id} value={brand.id.toString()}>
                          {brand.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Category Filter */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Категория</label>
                  <Select
                    value={filters.categoryId?.toString() || ''}
                    onValueChange={(value) =>
                      handleFilterChange('categoryId', value ? Number(value) : undefined)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Все категории" />
                    </SelectTrigger>
                    <SelectContent className="max-h-64">
                      <SelectItem value="">Все категории</SelectItem>
                      {flatCategories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id.toString()}>
                          {'—'.repeat(cat.level)} {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Price Range */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Цена от</label>
                  <Input
                    type="number"
                    placeholder="Мин. цена"
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value)}
                    onBlur={applyPriceFilter}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Цена до</label>
                  <Input
                    type="number"
                    placeholder="Макс. цена"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                    onBlur={applyPriceFilter}
                  />
                </div>
              </div>

              {/* Quick Filters */}
              <div className="flex flex-wrap gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <Checkbox
                    checked={!!filters.isFeatured}
                    onCheckedChange={(checked) => handleFilterChange('isFeatured', checked)}
                  />
                  <span className="text-sm">Рекомендованные</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <Checkbox
                    checked={!!filters.isNew}
                    onCheckedChange={(checked) => handleFilterChange('isNew', checked)}
                  />
                  <span className="text-sm">Новинки</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <Checkbox
                    checked={!!filters.isBestseller}
                    onCheckedChange={(checked) => handleFilterChange('isBestseller', checked)}
                  />
                  <span className="text-sm">Бестселлеры</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <Checkbox
                    checked={!!filters.isOnSale}
                    onCheckedChange={(checked) => handleFilterChange('isOnSale', checked)}
                  />
                  <span className="text-sm">Со скидкой</span>
                </label>

                {hasActiveFilters && (
                  <Button variant="ghost" size="sm" onClick={clearFilters} className="ml-auto">
                    <X className="mr-1 h-3 w-3" />
                    Сбросить
                  </Button>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Products Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
              <Package className="h-12 w-12 mb-4 opacity-50" />
              <p className="text-lg font-medium">Товары не найдены</p>
              <p className="text-sm">Попробуйте изменить фильтры поиска</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="w-16">Фото</TableHead>
                    <TableHead className="min-w-[200px]">Название</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead>Бренд</TableHead>
                    <TableHead>Категория</TableHead>
                    <TableHead className="text-right">Закупка</TableHead>
                    <TableHead className="text-right">Цена</TableHead>
                    <TableHead className="text-center">Статус</TableHead>
                    <TableHead className="w-16"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts.map((product) => (
                    <TableRow key={product.id} className="group hover:bg-muted/30">
                      <TableCell>
                        <div className="w-12 h-12 rounded-lg overflow-hidden bg-muted">
                          {product.image ? (
                            <img
                              src={product.image}
                              alt={product.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                              <Package className="h-5 w-5" />
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-[250px]">
                          <p className="font-medium text-foreground truncate">{product.name}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            ID: {product.id}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-xs">{product.sku}</TableCell>
                      <TableCell>{product.brand}</TableCell>
                      <TableCell>
                        <span className="text-sm">{product.category_name}</span>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {Number(product.purchasePrice).toLocaleString('ru-RU')} ₽
                      </TableCell>
                      <TableCell className="text-right">
                        <div>
                          <span className="font-semibold text-foreground">
                            {Number(product.price).toLocaleString('ru-RU')} ₽
                          </span>
                          {product.discountPrice && (
                            <p className="text-xs text-destructive">
                              {Number(product.discountPrice).toLocaleString('ru-RU')} ₽
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1 justify-center">
                          {product.inStock ? (
                            <Badge variant="outline" className="text-success border-success text-xs">
                              В наличии
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-destructive border-destructive text-xs">
                              Нет
                            </Badge>
                          )}
                          {product.isNew && (
                            <Badge className="bg-primary/10 text-primary text-xs">New</Badge>
                          )}
                          {product.isBestseller && (
                            <Badge className="bg-warning/10 text-warning text-xs">Best</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => navigate(`/products/${product.id}`)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Pagination */}
          {pages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-border">
              <p className="text-sm text-muted-foreground">
                Страница {filters.page} из {pages}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleFilterChange('page', (filters.page || 1) - 1)}
                  disabled={filters.page === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleFilterChange('page', (filters.page || 1) + 1)}
                  disabled={filters.page === pages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
