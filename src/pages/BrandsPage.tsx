import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import type { BrandListItem, BrandFilters } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { useToast } from '@/hooks/use-toast';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { Loader2, Award, Image as ImageIcon, Plus, Search, X } from 'lucide-react';

const ITEMS_PER_PAGE = 20;
const REFRESH_INTERVAL = 30000;

const filterLabels: Record<string, string> = {
  all: 'Все бренды',
  popular: 'Популярные',
  new: 'Новые',
  recommended: 'Рекомендуемые',
};

export default function BrandsPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [brands, setBrands] = useState<BrandListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [filters, setFilters] = useState<BrandFilters>({
    page: 1,
    limit: ITEMS_PER_PAGE,
  });
  const [searchInput, setSearchInput] = useState('');
  const debouncedSearch = useDebouncedValue(searchInput, 400);
  
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    pages: 1,
    hasMore: false,
  });

  const loadBrands = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await api.getBrands({
        ...filters,
        search: debouncedSearch || undefined,
      });
      setBrands(response.brands);
      setPagination({
        total: response.total,
        page: response.page,
        pages: response.pages,
        hasMore: response.hasMore,
      });
    } catch (error) {
      toast({
        title: 'Ошибка загрузки',
        description: 'Не удалось загрузить бренды',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [filters, debouncedSearch, toast]);

  useEffect(() => {
    loadBrands();
  }, [loadBrands]);

  useEffect(() => {
    const interval = setInterval(loadBrands, REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, [loadBrands]);

  // Reset page when search changes
  useEffect(() => {
    setFilters((prev) => ({ ...prev, page: 1 }));
  }, [debouncedSearch]);

  const handleFilterChange = (key: keyof BrandFilters, value: string | undefined) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
      page: 1,
    }));
  };

  const handlePageChange = (newPage: number) => {
    setFilters((prev) => ({ ...prev, page: newPage }));
  };

  const clearFilters = () => {
    setSearchInput('');
    setFilters({ page: 1, limit: ITEMS_PER_PAGE });
  };

  const hasActiveFilters = searchInput || filters.filter;

  const renderPaginationItems = () => {
    const items = [];
    const maxVisible = 5;
    let startPage = Math.max(1, pagination.page - Math.floor(maxVisible / 2));
    const endPage = Math.min(pagination.pages, startPage + maxVisible - 1);

    if (endPage - startPage + 1 < maxVisible) {
      startPage = Math.max(1, endPage - maxVisible + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      items.push(
        <PaginationItem key={i}>
          <PaginationLink
            onClick={() => handlePageChange(i)}
            isActive={i === pagination.page}
            className="cursor-pointer"
          >
            {i}
          </PaginationLink>
        </PaginationItem>
      );
    }
    return items;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Бренды</h1>
          <p className="text-muted-foreground">Всего {pagination.total} брендов</p>
        </div>
        <Button onClick={() => navigate('/brands/new')}>
          <Plus className="mr-2 h-4 w-4" />
          Добавить бренд
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-4">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px] max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Поиск по названию..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Filter */}
            <Select
              value={filters.filter || 'all'}
              onValueChange={(v) => handleFilterChange('filter', v === 'all' ? undefined : v as BrandFilters['filter'])}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Все бренды" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(filterLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Clear Filters */}
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                <X className="mr-2 h-4 w-4" />
                Сбросить
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Brands Table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : brands.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <Award className="h-12 w-12 mb-4 opacity-50" />
            <p className="text-lg font-medium">Брендов не найдено</p>
            {hasActiveFilters ? (
              <Button className="mt-4" variant="outline" onClick={clearFilters}>
                Сбросить фильтры
              </Button>
            ) : (
              <Button className="mt-4" onClick={() => navigate('/brands/new')}>
                <Plus className="mr-2 h-4 w-4" />
                Создать первый бренд
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">Лого</TableHead>
                  <TableHead>Название</TableHead>
                  <TableHead>Страна</TableHead>
                  <TableHead className="w-28">Товаров</TableHead>
                  <TableHead className="w-24">Год</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {brands.map((brand) => (
                  <TableRow
                    key={brand.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => navigate(`/brands/${brand.id}`)}
                  >
                    <TableCell>
                      <div className="w-12 h-12 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                        {brand.logo ? (
                          <img
                            src={brand.logo}
                            alt={brand.name}
                            className="w-full h-full object-contain p-1"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                            <ImageIcon className="h-5 w-5" />
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{brand.name}</p>
                        <p className="text-xs text-muted-foreground">/{brand.slug}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {brand.country || '—'}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {brand.productsCount}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {brand.founded || '—'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => handlePageChange(Math.max(1, pagination.page - 1))}
                    className={pagination.page === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                  />
                </PaginationItem>
                {renderPaginationItems()}
                <PaginationItem>
                  <PaginationNext
                    onClick={() => handlePageChange(Math.min(pagination.pages, pagination.page + 1))}
                    className={pagination.page === pagination.pages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}
        </>
      )}
    </div>
  );
}
