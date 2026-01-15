import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import type { Order } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import {
  ArrowLeft,
  Loader2,
  ShoppingCart,
  User,
  MapPin,
  CreditCard,
  Calendar,
  Package,
  Truck,
} from 'lucide-react';

const statusLabels: Record<string, { label: string; className: string }> = {
  pending: { label: 'Ожидает', className: 'bg-warning/10 text-warning' },
  processing: { label: 'В обработке', className: 'bg-primary/10 text-primary' },
  shipped: { label: 'Отправлен', className: 'bg-success/10 text-success' },
  delivered: { label: 'Доставлен', className: 'bg-success/10 text-success' },
  cancelled: { label: 'Отменён', className: 'bg-destructive/10 text-destructive' },
};

export default function OrderEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [isLoading, setIsLoading] = useState(true);
  const [order, setOrder] = useState<Order | null>(null);

  useEffect(() => {
    if (id) loadOrder(id);
  }, [id]);

  const loadOrder = async (orderId: string) => {
    setIsLoading(true);
    try {
      const data = await api.getOrder(Number(orderId));
      setOrder(data);
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось загрузить заказ',
        variant: 'destructive',
      });
      navigate('/orders');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusInfo = statusLabels[status] || { label: status, className: 'bg-muted text-muted-foreground' };
    return <Badge className={statusInfo.className}>{statusInfo.label}</Badge>;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/orders')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold text-foreground">Заказ не найден</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/orders')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-foreground">Заказ #{order.id}</h1>
          <p className="text-muted-foreground">
            {new Date(order.created_at).toLocaleString('ru-RU')}
          </p>
        </div>
        {getStatusBadge(order.status)}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Customer Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Клиент
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm text-muted-foreground">Имя</p>
              <p className="font-medium">
                {order.first_name || order.last_name
                  ? `${order.first_name || ''} ${order.last_name || ''}`.trim()
                  : '—'}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Email</p>
              <p className="font-medium">{order.user_email}</p>
            </div>
          </CardContent>
        </Card>

        {/* Shipping */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Доставка
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm text-muted-foreground">Адрес</p>
              <p className="font-medium">{order.shipping_address || '—'}</p>
            </div>
            {order.tracking_number && (
              <div>
                <p className="text-sm text-muted-foreground">Трек-номер</p>
                <p className="font-medium font-mono">{order.tracking_number}</p>
              </div>
            )}
            <div>
              <p className="text-sm text-muted-foreground">Стоимость доставки</p>
              <p className="font-medium">{Number(order.shipping_cost).toLocaleString('ru-RU')} ₽</p>
            </div>
          </CardContent>
        </Card>

        {/* Payment */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Оплата
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Способ</span>
              <Badge variant="outline">
                {order.payment_method === 'card' ? 'Карта' : 'Наличные'}
              </Badge>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Сумма товаров</span>
              <span>{Number(order.total_amount).toLocaleString('ru-RU')} ₽</span>
            </div>
            {Number(order.discount_amount) > 0 && (
              <div className="flex items-center justify-between text-success">
                <span>Скидка</span>
                <span>−{Number(order.discount_amount).toLocaleString('ru-RU')} ₽</span>
              </div>
            )}
            {Number(order.tax_amount) > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Налог</span>
                <span>{Number(order.tax_amount).toLocaleString('ru-RU')} ₽</span>
              </div>
            )}
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Доставка</span>
              <span>{Number(order.shipping_cost).toLocaleString('ru-RU')} ₽</span>
            </div>
            <Separator />
            <div className="flex items-center justify-between text-lg font-semibold">
              <span>Итого</span>
              <span>
                {(
                  Number(order.total_amount) +
                  Number(order.shipping_cost) -
                  Number(order.discount_amount) +
                  Number(order.tax_amount)
                ).toLocaleString('ru-RU')}{' '}
                ₽
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Order Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Информация
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Количество товаров</span>
              <span>{order.items_count} шт.</span>
            </div>
            {order.total_quantity && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Всего единиц</span>
                <span>{order.total_quantity}</span>
              </div>
            )}
            {order.notes && (
              <div>
                <p className="text-sm text-muted-foreground mb-1">Примечания</p>
                <p className="text-sm bg-muted p-2 rounded">{order.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
