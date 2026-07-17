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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Search,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Receipt,
  Pencil,
  Trash2,
  Save,
} from 'lucide-react';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';

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

const EDITABLE_STATUSES = ['pending', 'paid', 'completed'];
const DELETABLE_STATUSES = ['pending', 'cancelled'];

function paymentLabel(m: string): string {
  if (m === 'cash') return 'Наличные';
  if (m === 'card') return 'Карта';
  if (m === 'sbp') return 'СБП';
  return m;
}

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
  const [cashierFilter, setCashierFilter] = useState('');
  const [sourceFilter, setSourceFilter] = useState('pos');
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();
  const [cashiers, setCashiers] = useState<any[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [page, setPage] = useState(1);

  // Edit state
  const [editingOrder, setEditingOrder] = useState<any>(null);
  const [editForm, setEditForm] = useState({
    sale_date: '',
    payment_method: '',
    discount_amount: '',
    notes: '',
  });
  const [isSaving, setIsSaving] = useState(false);

  // Delete state
  const [deletingOrderId, setDeletingOrderId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    api.getSalesCashiers().then((res) => setCashiers(res.cashiers || res.data || [])).catch(() => {});
  }, []);

  const loadOrders = async () => {
    setIsLoading(true);
    try {
      const filters: any = { page, limit: 50 };
      if (debouncedSearch) filters.search = debouncedSearch;
      if (statusFilter && statusFilter !== 'all') filters.status = statusFilter;
      if (paymentFilter && paymentFilter !== 'all') filters.payment_method = paymentFilter;
      if (cashierFilter && cashierFilter !== 'all') filters.created_by = Number(cashierFilter);
      if (sourceFilter && sourceFilter !== 'all') filters.order_source = sourceFilter;
      if (periodFilter === 'today') filters.today_only = true;
      else if (periodFilter === 'week') filters.this_week = true;
      else if (periodFilter === 'month') filters.this_month = true;
      else if (periodFilter === 'custom') {
        if (dateFrom) filters.date_from = format(dateFrom, 'yyyy-MM-dd');
        if (dateTo) filters.date_to = format(dateTo, 'yyyy-MM-dd');
      }

      const res = await api.getSales(filters);
      setOrders(res.orders || res.data || []);
      setPagination(res.pagination || { total: 0, page: 1, totalPages: 1 });
    } catch (error: any) {
      toast({ title: 'Ошибка', description: error.message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, statusFilter, paymentFilter, periodFilter, cashierFilter, sourceFilter, dateFrom, dateTo]);

  useEffect(() => {
    loadOrders();
  }, [page, debouncedSearch, statusFilter, paymentFilter, periodFilter, cashierFilter, sourceFilter, dateFrom, dateTo]);

  const openEdit = (order: any) => {
    setEditForm({
      sale_date: order.sale_date || order.created_at || '',
      payment_method: order.payment_method || 'cash',
      discount_amount: order.discount_amount ? String(Number(order.discount_amount)) : '0',
      notes: order.notes || '',
    });
    setEditingOrder(order);
  };

  const handleSaveEdit = async () => {
    if (!editingOrder) return;
    setIsSaving(true);
    try {
      const payload: any = {
        payment_method: editForm.payment_method,
        discount_amount: Number(editForm.discount_amount) || 0,
        notes: editForm.notes || undefined,
      };
      if (editForm.sale_date) payload.sale_date = editForm.sale_date;
      await api.updateSale(editingOrder.id, payload);
      toast({ title: 'Успешно', description: 'Продажа обновлена' });
      setEditingOrder(null);
      loadOrders();
    } catch (error: any) {
      toast({ title: 'Ошибка', description: error.message, variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingOrderId) return;
    setIsDeleting(true);
    try {
      await api.deleteSale(deletingOrderId);
      toast({ title: 'Успешно', description: 'Продажа удалена' });
      setDeletingOrderId(null);
      setSelectedOrder(null);
      loadOrders();
    } catch (error: any) {
      toast({ title: 'Ошибка', description: error.message, variant: 'destructive' });
    } finally {
      setIsDeleting(false);
    }
  };

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
                <SelectItem value="custom">Свой диапазон</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sourceFilter} onValueChange={setSourceFilter}>
              <SelectTrigger className="w-full lg:w-36">
                <SelectValue placeholder="Источник" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все продажи</SelectItem>
                <SelectItem value="pos">Касса</SelectItem>
                <SelectItem value="website">Сайт</SelectItem>
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
                <SelectItem value="sbp">СБП</SelectItem>
              </SelectContent>
            </Select>
            <Select value={cashierFilter} onValueChange={setCashierFilter}>
              <SelectTrigger className="w-full lg:w-44">
                <SelectValue placeholder="Кассир" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все кассиры</SelectItem>
                {cashiers.map((c) => (
                  <SelectItem key={c.id} value={String(c.id)}>
                    {c.first_name ? `${c.first_name} ${c.last_name || ''}`.trim() : c.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {periodFilter === 'custom' && (
            <div className="flex flex-col md:flex-row gap-3 mt-3">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn('justify-start text-left font-normal md:w-56', !dateFrom && 'text-muted-foreground')}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateFrom ? format(dateFrom, 'dd.MM.yyyy') : 'С даты'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={dateFrom} onSelect={setDateFrom} initialFocus className={cn('p-3 pointer-events-auto')} />
                </PopoverContent>
              </Popover>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn('justify-start text-left font-normal md:w-56', !dateTo && 'text-muted-foreground')}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateTo ? format(dateTo, 'dd.MM.yyyy') : 'По дату'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={dateTo} onSelect={setDateTo} initialFocus className={cn('p-3 pointer-events-auto')} />
                </PopoverContent>
              </Popover>
            </div>
          )}
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
                  <TableHead>Источник</TableHead>
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
                      {format(new Date(order.sale_date || order.created_at), 'dd.MM.yyyy HH:mm')}
                    </TableCell>
                    <TableCell className="text-sm">
                      {order.cashier_first_name || order.cashier_email}
                    </TableCell>
                    <TableCell className="text-center">{order.items_count}</TableCell>
                    <TableCell className="text-center">{order.total_items_quantity}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {paymentLabel(order.payment_method)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="text-xs">
                        {order.order_source === 'pos' ? 'Касса' : 'Сайт'}
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
        <DialogContent className="max-w-lg max-h-[90vh] flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>Чек #{selectedOrder?.id}</DialogTitle>
            <DialogDescription>
              {selectedOrder && format(new Date(selectedOrder.created_at), 'dd.MM.yyyy HH:mm')}
            </DialogDescription>
          </DialogHeader>
          {selectedOrder && (
            <div className="flex-1 overflow-y-auto space-y-4 pr-1">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Кассир:</span>
                  <p className="font-medium">{selectedOrder.cashier_first_name || selectedOrder.cashier_email}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Оплата:</span>
                  <p className="font-medium">{paymentLabel(selectedOrder.payment_method)}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Статус:</span>
                  <Badge className={statusColors[selectedOrder.status] || ''}>
                    {statusLabels[selectedOrder.status] || selectedOrder.status}
                  </Badge>
                </div>
                {selectedOrder.discount_amount && Number(selectedOrder.discount_amount) > 0 && (
                  <div>
                    <span className="text-muted-foreground">Скидка:</span>
                    <p className="font-medium text-destructive">
                      -{Number(selectedOrder.discount_amount).toLocaleString('ru-RU')} ₽
                    </p>
                  </div>
                )}
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

              {/* Action buttons */}
              <div className="flex gap-2 pt-2 border-t">
                {EDITABLE_STATUSES.includes(selectedOrder.status) && (
                  <Button
                    variant="outline"
                    className="flex-1 gap-2"
                    onClick={(e) => {
                      e.stopPropagation();
                      openEdit(selectedOrder);
                      setSelectedOrder(null);
                    }}
                  >
                    <Pencil className="h-4 w-4" />
                    Редактировать
                  </Button>
                )}
                {DELETABLE_STATUSES.includes(selectedOrder.status) && (
                  <Button
                    variant="destructive"
                    className="flex-1 gap-2"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeletingOrderId(selectedOrder.id);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                    Удалить
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit dialog */}
      <Dialog open={!!editingOrder} onOpenChange={() => setEditingOrder(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Редактировать продажу #{editingOrder?.id}</DialogTitle>
            <DialogDescription>Измените данные продажи</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Дата продажи</Label>
              <Input
                type="datetime-local"
                value={editForm.sale_date ? editForm.sale_date.slice(0, 16) : ''}
                onChange={(e) => setEditForm((f) => ({ ...f, sale_date: e.target.value.replace('T', ' ') + ':00' }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Способ оплаты</Label>
              <Select value={editForm.payment_method} onValueChange={(v) => setEditForm((f) => ({ ...f, payment_method: v }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Наличные</SelectItem>
                  <SelectItem value="card">Карта</SelectItem>
                  <SelectItem value="sbp">СБП</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Скидка (₽)</Label>
              <Input
                type="number"
                min="0"
                value={editForm.discount_amount}
                onChange={(e) => setEditForm((f) => ({ ...f, discount_amount: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Заметки</Label>
              <Textarea
                value={editForm.notes}
                onChange={(e) => setEditForm((f) => ({ ...f, notes: e.target.value }))}
                placeholder="Необязательно"
                rows={2}
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setEditingOrder(null)}>Отмена</Button>
              <Button onClick={handleSaveEdit} disabled={isSaving} className="gap-2">
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Сохранить
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={!!deletingOrderId} onOpenChange={() => setDeletingOrderId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить чек #{deletingOrderId}?</AlertDialogTitle>
            <AlertDialogDescription>
              Это действие необратимо. Товары будут возвращены на склад.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Отмена</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
