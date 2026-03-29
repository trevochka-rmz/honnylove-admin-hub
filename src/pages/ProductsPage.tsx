import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
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
  Search,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Package,
  Download,
  FileText,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function ProductsPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { toast } = useToast();
  const { isAdmin } = useAuth();
  const tableRef = useRef<HTMLDivElement>(null);

  const [products, setProducts] = useState<Product[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(false);
  const hasLoadedRef = useRef(false);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);

  // Initialize filters from URL params
  const getInitialFilters = useCallback((): ProductFilters => {
    const page = parseInt(searchParams.get('page') || '1', 10);
    const sort = searchParams.get('sort') || undefined;
    return {
      page: isNaN(page) ? 1 : page,
      limit: 50,
      sort: sort as ProductFilters['sort'],
    };
  }, [searchParams]);

  const [filters, setFilters] = useState<ProductFilters>(getInitialFilters);

  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');

  // Sync filters to URL
  useEffect(() => {
    const params = new URLSearchParams();
    if (filters.page && filters.page > 1) params.set('page', filters.page.toString());
    if (filters.sort) params.set('sort', filters.sort);
    setSearchParams(params, { replace: true });
  }, [filters, setSearchParams]);

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
    const firstLoad = !hasLoadedRef.current;
    if (firstLoad) setIsLoading(true);
    else setIsFetching(true);

    try {
      const response = await api.getProducts(filters);
      setProducts(response.products);
      setTotal(response.total);
      setPages(response.pages);
      hasLoadedRef.current = true;
    } catch (error) {
      toast({
        title: 'Ошибка загрузки',
        description: 'Не удалось загрузить товары',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
      setIsFetching(false);
    }
  };

  const handleFilterChange = (key: keyof ProductFilters, value: any) => {
    setFilters((prev) => {
      const next: ProductFilters = {
        ...prev,
        [key]: value || undefined,
      };

      // При изменении фильтров всегда возвращаемся на 1 страницу.
      // Но при пагинации page должен меняться корректно.
      if (key !== 'page') {
        next.page = 1;
      }

      // Scroll to top when changing page
      if (key === 'page') {
        tableRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }

      return next;
    });
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
    filters.sort;

  const handleExportCSV = async () => {
    try {
      const blob = await api.exportProductsCSV();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'products.csv';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      toast({ title: 'Успешно', description: 'CSV файл скачан' });
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось экспортировать CSV',
        variant: 'destructive',
      });
    }
  };

  const handleExportPDF = async () => {
    try {
      const blob = await api.exportProductsPDF();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'products.pdf';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      toast({ title: 'Успешно', description: 'PDF файл скачан' });
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось экспортировать PDF',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Товары</h1>
          <p className="text-muted-foreground flex items-center gap-2">
            Всего {total} товаров
            {isFetching && !isLoading && (
              <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleExportCSV}>
            <Download className="mr-2 h-4 w-4" />
            CSV
          </Button>
          <Button variant="outline" onClick={handleExportPDF}>
            <FileText className="mr-2 h-4 w-4" />
            PDF
          </Button>
          {isAdmin && (
            <Button onClick={() => navigate('/products/new')}>
              <Plus className="mr-2 h-4 w-4" />
              Добавить товар
            </Button>
          )}
        </div>
      </div>

      {/* Search & Sort */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Поиск по названию или бренду..."
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
          </div>
        </CardContent>
      </Card>

      {/* Products Table */}
      <Card ref={tableRef}>
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
                    <TableHead>Бренд</TableHead>
                    <TableHead>Категория</TableHead>
                    {isAdmin && <TableHead className="text-right">Закупка</TableHead>}
                    <TableHead className="text-right">Цена</TableHead>
                    <TableHead className="text-right">Цена KG</TableHead>
                    <TableHead className="text-center">Статус</TableHead>
                    <TableHead className="text-center">Кол-во</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts.map((product) => (
                    <TableRow 
                      key={product.id} 
                      className="group hover:bg-muted/30 cursor-pointer"
                      onClick={() => navigate(`/products/${product.id}`)}
                    >
                      <TableCell>
                        <div className="w-12 h-12 rounded-lg overflow-hidden bg-muted">
                          {product.image ? (
                            <img
                              src={product.image.startsWith('/') ? `${import.meta.env.VITE_API_BASE_URL}${product.image}` : product.image}
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
                      <TableCell>{product.brand}</TableCell>
                      <TableCell>
                        <span className="text-sm">{product.category_name}</span>
                      </TableCell>
                      {isAdmin && (
                        <TableCell className="text-right font-medium">
                          {Number(product.purchasePrice).toLocaleString('ru-RU')} ₽
                        </TableCell>
                      )}
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
                      <TableCell className="text-right">
                        {product.priceKg ? (
                          <div>
                            <span className="font-semibold text-foreground">
                              {Number(product.priceKg).toLocaleString('ru-RU')} сом
                            </span>
                            {product.discountPriceKg && (
                              <p className="text-xs text-destructive">
                                {Number(product.discountPriceKg).toLocaleString('ru-RU')} сом
                              </p>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
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
                      <TableCell className="text-center">
                        <span className={cn(
                          'font-medium',
                          (product.stockQuantity ?? 0) === 0 && 'text-destructive',
                          (product.stockQuantity ?? 0) > 0 && (product.stockQuantity ?? 0) <= 5 && 'text-warning',
                          (product.stockQuantity ?? 0) > 5 && 'text-success'
                        )}>
                          {product.stockQuantity ?? 0}
                        </span>
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
