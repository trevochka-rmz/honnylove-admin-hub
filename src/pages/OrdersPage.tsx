import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import type { Order, OrderFilters } from '@/types';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import {
  Search,
  Loader2,
  ShoppingCart,
  Plus,
  ChevronLeft,
  ChevronRight,
  X,
  Calendar,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const statusColors: Record<string, string> = {
  pending: 'bg-warning/10 text-warning',
  paid: 'bg-primary/10 text-primary',
  processing: 'bg-blue-500/10 text-blue-600',
  shipped: 'bg-purple-500/10 text-purple-600',
  delivered: 'bg-success/10 text-success',
  cancelled: 'bg-destructive/10 text-destructive',
  returned: 'bg-orange-500/10 text-orange-600',
  completed: 'bg-green-600/10 text-green-700',
};

export default function OrdersPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAdmin } = useAuth();

  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(false);
  const hasLoadedRef = useRef(false);

  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);

  // Filters
  const [filters, setFilters] = useState<OrderFilters>({
    page: 1,
    limit: 50,
  });
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebouncedValue(searchTerm, 350);

  // Statuses from API
  const [statuses, setStatuses] = useState<string[]>([]);
  const [statusDescriptions, setStatusDescriptions] = useState<Record<string, string>>({});

  // Date filters
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  useEffect(() => {
    api.getOrderStatuses().then((res) => {
      setStatuses(res.data.statuses);
      setStatusDescriptions(res.data.descriptions);
    });
  }, []);

  useEffect(() => {
    loadOrders();
  }, [filters, debouncedSearch]);

  const loadOrders = async () => {
    const firstLoad = !hasLoadedRef.current;
    if (firstLoad) setIsLoading(true);
    else setIsFetching(true);

    try {
      const response = await api.getOrders({
        ...filters,
        search: debouncedSearch || undefined,
      });
      setOrders(response.orders);
      setTotal(response.pagination.total);
      setPages(response.pagination.totalPages);
      hasLoadedRef.current = true;
    } catch (error) {
      toast({
        title: 'Ошибка загрузки',
        description: 'Не удалось загрузить заказы',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
      setIsFetching(false);
    }
  };

  const handleFilterChange = (key: keyof OrderFilters, value: any) => {
    setFilters((prev) => {
      const next: OrderFilters = {
        ...prev,
        [key]: value || undefined,
      };
      if (key !== 'page') {
        next.page = 1;
      }
      return next;
    });
  };

  const applyDateFilter = () => {
    setFilters((prev) => ({
      ...prev,
      page: 1,
      date_from: dateFrom || undefined,
      date_to: dateTo || undefined,
    }));
  };

  const clearFilters = () => {
    setFilters({ page: 1, limit: 50 });
    setSearchTerm('');
    setDateFrom('');
    setDateTo('');
  };

  const getStatusBadge = (status: string) => {
    const label = statusDescriptions[status] || status;
    const colorClass = statusColors[status] || 'bg-muted text-muted-foreground';
    return <Badge className={colorClass}>{label}</Badge>;
  };

  const hasActiveFilters = useMemo(
    () =>
      !!(filters.status || filters.user_id || filters.date_from || filters.date_to || debouncedSearch),
    [filters, debouncedSearch]
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Заказы</h1>
          <p className="text-muted-foreground flex items-center gap-2">
            Всего {total} заказов
            {isFetching && !isLoading && (
              <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
            )}
          </p>
        </div>
        {isAdmin && (
          <Button onClick={() => navigate('/orders/new')} className="gap-2">
            <Plus className="h-4 w-4" />
            Добавить заказ
          </Button>
        )}
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4 space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Поиск по номеру, email или имени..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Status filter */}
            <Select
              value={filters.status || 'all'}
              onValueChange={(v) => handleFilterChange('status', v === 'all' ? undefined : v)}
            >
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Все статусы" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все статусы</SelectItem>
                {statuses.map((s) => (
                  <SelectItem key={s} value={s}>
                    {statusDescriptions[s] || s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* User ID filter */}
            <Input
              type="number"
              placeholder="ID пользователя"
              className="w-full md:w-[150px]"
              value={filters.user_id || ''}
              onChange={(e) =>
                handleFilterChange('user_id', e.target.value ? Number(e.target.value) : undefined)
              }
            />
          </div>

          {/* Date range */}
          <div className="flex flex-col md:flex-row gap-4 items-end">
            <div className="flex items-center gap-2 flex-1">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="flex-1"
                placeholder="Дата от"
              />
              <span className="text-muted-foreground">—</span>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="flex-1"
                placeholder="Дата до"
              />
              <Button variant="outline" size="sm" onClick={applyDateFilter}>
                Применить
              </Button>
            </div>

            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-2">
                <X className="h-4 w-4" />
                Сбросить фильтры
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : orders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
              <ShoppingCart className="h-12 w-12 mb-4 opacity-50" />
              <p className="text-lg font-medium">Заказы не найдены</p>
              <p className="text-sm">Попробуйте изменить фильтры</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="w-16">№</TableHead>
                    <TableHead>Клиент</TableHead>
                    <TableHead>Сумма</TableHead>
                    <TableHead>Товаров</TableHead>
                    <TableHead>Оплата</TableHead>
                    <TableHead>Статус</TableHead>
                    <TableHead>Дата</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order) => (
                    <TableRow
                      key={order.id}
                      className="group hover:bg-muted/30 cursor-pointer"
                      onClick={() => navigate(`/orders/${order.id}`)}
                    >
                      <TableCell className="font-mono font-medium">#{order.id}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium text-foreground">
                            {order.user_first_name || order.user_last_name
                              ? `${order.user_first_name || ''} ${order.user_last_name || ''}`.trim()
                              : order.first_name || order.last_name
                              ? `${order.first_name || ''} ${order.last_name || ''}`.trim()
                              : '—'}
                          </p>
                          <p className="text-xs text-muted-foreground">{order.user_email}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-semibold">
                          {Number(order.total_amount).toLocaleString('ru-RU')} ₽
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">
                          {order.items_count} шт.
                          {(order.total_quantity || order.total_items_quantity) &&
                            ` (${order.total_quantity || order.total_items_quantity})`}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {order.payment_method === 'card' ? 'Карта' : 'Наличные'}
                        </Badge>
                      </TableCell>
                      <TableCell>{getStatusBadge(order.status)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(order.created_at).toLocaleDateString('ru-RU')}
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
                  onClick={() => handleFilterChange('page', Math.max(1, (filters.page || 1) - 1))}
                  disabled={(filters.page || 1) === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleFilterChange('page', Math.min(pages, (filters.page || 1) + 1))}
                  disabled={(filters.page || 1) === pages}
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
