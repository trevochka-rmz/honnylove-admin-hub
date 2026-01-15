import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import type { Order } from '@/types';
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
import { useToast } from '@/hooks/use-toast';
import { Search, Loader2, ShoppingCart } from 'lucide-react';
import { cn } from '@/lib/utils';

const statusLabels: Record<string, { label: string; className: string }> = {
  pending: { label: 'Ожидает', className: 'bg-warning/10 text-warning' },
  processing: { label: 'В обработке', className: 'bg-primary/10 text-primary' },
  shipped: { label: 'Отправлен', className: 'bg-success/10 text-success' },
  delivered: { label: 'Доставлен', className: 'bg-success/10 text-success' },
  cancelled: { label: 'Отменён', className: 'bg-destructive/10 text-destructive' },
};

export default function OrdersPage() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(false);
  const hasLoadedRef = useRef(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    const firstLoad = !hasLoadedRef.current;
    if (firstLoad) setIsLoading(true);
    else setIsFetching(true);

    try {
      const data = await api.getOrders();
      setOrders(data);
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

  const filteredOrders = searchTerm
    ? orders.filter(
        (o) =>
          o.id.toString().includes(searchTerm) ||
          o.user_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          o.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          o.last_name?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : orders;

  const getStatusBadge = (status: string) => {
    const statusInfo = statusLabels[status] || { label: status, className: 'bg-muted text-muted-foreground' };
    return <Badge className={statusInfo.className}>{statusInfo.label}</Badge>;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Заказы</h1>
          <p className="text-muted-foreground flex items-center gap-2">
            Всего {orders.length} заказов
            {isFetching && !isLoading && (
              <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
            )}
          </p>
        </div>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Поиск по номеру, email или имени..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
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
          ) : filteredOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
              <ShoppingCart className="h-12 w-12 mb-4 opacity-50" />
              <p className="text-lg font-medium">Заказы не найдены</p>
              <p className="text-sm">Попробуйте изменить поиск</p>
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
                  {filteredOrders.map((order) => (
                    <TableRow
                      key={order.id}
                      className="group hover:bg-muted/30 cursor-pointer"
                      onClick={() => navigate(`/orders/${order.id}`)}
                    >
                      <TableCell className="font-mono font-medium">#{order.id}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium text-foreground">
                            {order.first_name || order.last_name
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
                          {order.total_quantity && ` (${order.total_quantity})`}
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
        </CardContent>
      </Card>
    </div>
  );
}
