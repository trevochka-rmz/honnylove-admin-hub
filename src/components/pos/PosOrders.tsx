import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Search,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Receipt,
  Calendar,
} from 'lucide-react';
import { format } from 'date-fns';

const statusColors: Record<string, string> = {
  pending: 'bg-warning/10 text-warning',
  paid: 'bg-primary/10 text-primary',
  completed: 'bg-green-600/10 text-green-700',
  cancelled: 'bg-destructive/10 text-destructive',
};

const statusLabels: Record<string, string> = {
  pending: 'Ожидает',
  paid: 'Оплачен',
  completed: 'Завершён',
  cancelled: 'Отменён',
};

export default function PosOrders() {
  const { toast } = useToast();
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pagination, setPagination] = useState({ total: 0, page: 1, totalPages: 1 });
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, 400);
  const [statusFilter, setStatusFilter] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('');
  const [periodFilter, setPeriodFilter] = useState('today');
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [page, setPage] = useState(1);

  const loadOrders = async () => {
    setIsLoading(true);
    try {
      const filters: any = { page, limit: 50 };
      if (debouncedSearch) filters.search = debouncedSearch;
      if (statusFilter) filters.status = statusFilter;
      if (paymentFilter) filters.payment_method = paymentFilter;
      if (periodFilter === 'today') filters.today_only = true;
      else if (periodFilter === 'week') filters.this_week = true;
      else if (periodFilter === 'month') filters.this_month = true;

      const res = await api.posGetOrders(filters);
      setOrders(res.orders || []);
      setPagination(res.pagination || { total: 0, page: 1, totalPages: 1 });
    } catch (error: any) {
      toast({ title: 'Ошибка', description: error.message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, statusFilter, paymentFilter, periodFilter]);

  useEffect(() => {
    loadOrders();
  }, [page, debouncedSearch, statusFilter, paymentFilter, periodFilter]);

  return (
    <div className="space-y-4 mt-4">
      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Поиск по номеру чека или имени..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={periodFilter} onValueChange={setPeriodFilter}>
              <SelectTrigger className="w-full lg:w-40">
                <SelectValue placeholder="Период" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Сегодня</SelectItem>
                <SelectItem value="week">Эта неделя</SelectItem>
                <SelectItem value="month">Этот месяц</SelectItem>
                <SelectItem value="all">Все</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full lg:w-36">
                <SelectValue placeholder="Статус" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все статусы</SelectItem>
                <SelectItem value="completed">Завершён</SelectItem>
                <SelectItem value="paid">Оплачен</SelectItem>
                <SelectItem value="pending">Ожидает</SelectItem>
                <SelectItem value="cancelled">Отменён</SelectItem>
              </SelectContent>
            </Select>
            <Select value={paymentFilter} onValueChange={setPaymentFilter}>
              <SelectTrigger className="w-full lg:w-36">
                <SelectValue placeholder="Оплата" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все способы</SelectItem>
                <SelectItem value="cash">Наличные</SelectItem>
                <SelectItem value="card">Карта</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Orders table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : orders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
              <Receipt className="h-12 w-12 mb-4 opacity-50" />
              <p className="text-lg font-medium">Чеки не найдены</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>ID</TableHead>
                  <TableHead>Дата</TableHead>
                  <TableHead>Кассир</TableHead>
                  <TableHead className="text-center">Позиций</TableHead>
                  <TableHead className="text-center">Кол-во</TableHead>
                  <TableHead>Оплата</TableHead>
                  <TableHead>Статус</TableHead>
                  <TableHead className="text-right">Сумма</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order) => (
                  <TableRow
                    key={order.id}
                    className="cursor-pointer hover:bg-muted/30"
                    onClick={() => setSelectedOrder(order)}
                  >
                    <TableCell className="font-medium">#{order.id}</TableCell>
                    <TableCell className="text-sm">
                      {format(new Date(order.created_at), 'dd.MM.yyyy HH:mm')}
                    </TableCell>
                    <TableCell className="text-sm">
                      {order.cashier_first_name || order.cashier_email}
                    </TableCell>
                    <TableCell className="text-center">{order.items_count}</TableCell>
                    <TableCell className="text-center">{order.total_items_quantity}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {order.payment_method === 'cash' ? 'Наличные' : 'Карта'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={statusColors[order.status] || 'bg-muted text-muted-foreground'}>
                        {statusLabels[order.status] || order.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      {Number(order.total_amount).toLocaleString('ru-RU')} ₽
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-border">
              <p className="text-sm text-muted-foreground">
                Стр. {pagination.page} из {pagination.totalPages} (всего {pagination.total})
              </p>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setPage((p) => p - 1)} disabled={page <= 1}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={() => setPage((p) => p + 1)} disabled={page >= pagination.totalPages}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Order detail dialog */}
      <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Чек #{selectedOrder?.id}</DialogTitle>
            <DialogDescription>
              {selectedOrder && format(new Date(selectedOrder.created_at), 'dd.MM.yyyy HH:mm')}
            </DialogDescription>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Кассир:</span>
                  <p className="font-medium">{selectedOrder.cashier_first_name || selectedOrder.cashier_email}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Оплата:</span>
                  <p className="font-medium">{selectedOrder.payment_method === 'cash' ? 'Наличные' : 'Карта'}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Статус:</span>
                  <Badge className={statusColors[selectedOrder.status] || ''}>
                    {statusLabels[selectedOrder.status] || selectedOrder.status}
                  </Badge>
                </div>
              </div>

              {selectedOrder.items && selectedOrder.items.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-2">Товары:</p>
                  <div className="border rounded-lg divide-y">
                    {selectedOrder.items.map((item: any, idx: number) => (
                      <div key={idx} className="flex justify-between items-center p-2 text-sm">
                        <div className="flex-1 min-w-0">
                          <p className="truncate">{item.product_name}</p>
                          <p className="text-xs text-muted-foreground">{item.quantity} × {Number(item.price).toLocaleString('ru-RU')} ₽</p>
                        </div>
                        <span className="font-medium ml-2">{Number(item.line_total).toLocaleString('ru-RU')} ₽</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="border-t pt-2 flex justify-between text-lg font-bold">
                <span>Итого:</span>
                <span className="text-primary">{Number(selectedOrder.total_amount).toLocaleString('ru-RU')} ₽</span>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
