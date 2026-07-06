import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import type { Order, Product } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import {
  ArrowLeft,
  Loader2,
  Save,
  Trash2,
  ShoppingCart,
  User,
  MapPin,
  CreditCard,
  Package,
  Clock,
  Plus,
  X,
  ChevronsUpDown,
  Check,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const API_BASE = import.meta.env.VITE_API_BASE_URL;

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

export default function OrderEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAdmin } = useAuth();

  const isNew = id === 'new';

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [order, setOrder] = useState<Order | null>(null);

  // Editable fields
  const [shippingAddress, setShippingAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [shippingCost, setShippingCost] = useState('');
  const [taxAmount, setTaxAmount] = useState('');
  const [discountAmount, setDiscountAmount] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [notes, setNotes] = useState('');

  // Status change
  const [newStatus, setNewStatus] = useState('');
  const [statusNotes, setStatusNotes] = useState('');
  const [isChangingStatus, setIsChangingStatus] = useState(false);
  const [showStatusDialog, setShowStatusDialog] = useState(false);

  // Status descriptions
  const [statusDescriptions, setStatusDescriptions] = useState<Record<string, string>>({});

  // For adding items
  const [products, setProducts] = useState<Product[]>([]);
  const [productOpen, setProductOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const [productQuantity, setProductQuantity] = useState('1');

  useEffect(() => {
    if (isNew) {
      navigate('/orders/new');
      return;
    }
    if (id) loadOrder(id);
  }, [id, isNew]);

  useEffect(() => {
    api.getOrderStatuses().then((res) => {
      setStatusDescriptions(res.data.descriptions);
    });
    api.getProducts({ limit: 500 }).then((res) => {
      setProducts(res.products);
    });
  }, []);

  const loadOrder = async (orderId: string) => {
    setIsLoading(true);
    try {
      const data = await api.getOrder(Number(orderId));
      setOrder(data);
      setShippingAddress(data.shipping_address || '');
      setPaymentMethod(data.payment_method || 'card');
      setShippingCost(data.shipping_cost || '');
      setTaxAmount(data.tax_amount || '');
      setDiscountAmount(data.discount_amount || '');
      setTrackingNumber(data.tracking_number || '');
      setNotes(data.notes || '');
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

  const handleSave = async () => {
    if (!order) return;

    setIsSaving(true);
    try {
      await api.updateOrder(order.id, {
        shipping_address: shippingAddress,
        payment_method: paymentMethod,
        shipping_cost: Number(shippingCost) || 0,
        tax_amount: Number(taxAmount) || 0,
        discount_amount: Number(discountAmount) || 0,
        tracking_number: trackingNumber || undefined,
        notes: notes || undefined,
      });

      toast({ title: 'Успешно', description: 'Заказ обновлён' });
      loadOrder(String(order.id));
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: error instanceof Error ? error.message : 'Не удалось обновить заказ',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!order) return;
    try {
      await api.deleteOrder(order.id);
      toast({ title: 'Удалено', description: 'Заказ удалён' });
      navigate('/orders');
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: error instanceof Error ? error.message : 'Не удалось удалить заказ',
        variant: 'destructive',
      });
    }
  };

  const handleAddItem = async () => {
    if (!order || !selectedProductId) return;

    try {
      await api.addOrderItem(order.id, {
        product_id: selectedProductId,
        quantity: Number(productQuantity) || 1,
      });
      toast({ title: 'Добавлено', description: 'Товар добавлен в заказ' });
      setSelectedProductId(null);
      setProductQuantity('1');
      setProductOpen(false);
      loadOrder(String(order.id));
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: error instanceof Error ? error.message : 'Не удалось добавить товар',
        variant: 'destructive',
      });
    }
  };

  const handleRemoveItem = async (itemId: number) => {
    if (!order) return;

    try {
      await api.removeOrderItem(order.id, itemId);
      toast({ title: 'Удалено', description: 'Товар удалён из заказа' });
      loadOrder(String(order.id));
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: error instanceof Error ? error.message : 'Не удалось удалить товар',
        variant: 'destructive',
      });
    }
  };

  const handleStatusChange = async () => {
    if (!order || !newStatus) return;
    setIsChangingStatus(true);
    try {
      const result = await api.updateOrderStatus(order.id, {
        newStatus,
        notes: statusNotes || undefined,
      });
      toast({ title: 'Успешно', description: result.message || 'Статус изменён' });
      setShowStatusDialog(false);
      setNewStatus('');
      setStatusNotes('');
      loadOrder(String(order.id));
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: error instanceof Error ? error.message : 'Не удалось изменить статус',
        variant: 'destructive',
      });
    } finally {
      setIsChangingStatus(false);
    }
  };

  const allStatuses = ['pending', 'paid', 'processing', 'shipped', 'delivered', 'completed', 'cancelled', 'returned'];
  const statusLabelsMap: Record<string, string> = {
    pending: 'Ожидает',
    paid: 'Оплачен',
    processing: 'В обработке',
    shipped: 'Отправлен',
    delivered: 'Доставлен',
    completed: 'Завершён',
    cancelled: 'Отменён',
    returned: 'Возврат',
  };

  const getStatusBadge = (status: string) => {
    const label = statusDescriptions[status] || status;
    const colorClass = statusColors[status] || 'bg-muted text-muted-foreground';
    return <Badge className={colorClass}>{label}</Badge>;
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

  const totalAmount =
    Number(order.total_amount) +
    Number(shippingCost || 0) -
    Number(discountAmount || 0) +
    Number(taxAmount || 0);

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
        {isAdmin && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowStatusDialog(true)}
          >
            Изменить статус
          </Button>
        )}
        {isAdmin && (
          <div className="flex items-center gap-2">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <Trash2 className="h-4 w-4" />
                  Удалить
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Удалить заказ?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Это действие нельзя отменить. Заказ будет удалён навсегда.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Отмена</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete}>Удалить</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <Button onClick={handleSave} disabled={isSaving} className="gap-2">
              {isSaving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Сохранить
            </Button>
          </div>
        )}
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
                {order.user_first_name || order.user_last_name
                  ? `${order.user_first_name || ''} ${order.user_last_name || ''}`.trim()
                  : '—'}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Email</p>
              <p className="font-medium">{order.user_email}</p>
            </div>
            {order.user_phone && (
              <div>
                <p className="text-sm text-muted-foreground">Телефон</p>
                <p className="font-medium">{order.user_phone}</p>
              </div>
            )}
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
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="address">Адрес</Label>
              <Textarea
                id="address"
                value={shippingAddress}
                onChange={(e) => setShippingAddress(e.target.value)}
                disabled={!isAdmin}
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tracking">Трек-номер</Label>
              <Input
                id="tracking"
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                disabled={!isAdmin}
                placeholder="TRACK123456"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="shipping_cost">Стоимость доставки (₽)</Label>
              <Input
                id="shipping_cost"
                type="number"
                value={shippingCost}
                onChange={(e) => setShippingCost(e.target.value)}
                disabled={!isAdmin}
              />
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
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Способ оплаты</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod} disabled={!isAdmin}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="card">Карта</SelectItem>
                  <SelectItem value="sbp">СБП</SelectItem>
                  <SelectItem value="cash">Наличные</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Сумма товаров</span>
              <span>{Number(order.total_amount).toLocaleString('ru-RU')} ₽</span>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="discount" className="text-muted-foreground">
                  Скидка (₽)
                </Label>
                <Input
                  id="discount"
                  type="number"
                  value={discountAmount}
                  onChange={(e) => setDiscountAmount(e.target.value)}
                  disabled={!isAdmin}
                  className="w-32 text-right"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="tax" className="text-muted-foreground">
                  Налог (₽)
                </Label>
                <Input
                  id="tax"
                  type="number"
                  value={taxAmount}
                  onChange={(e) => setTaxAmount(e.target.value)}
                  disabled={!isAdmin}
                  className="w-32 text-right"
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Доставка</span>
              <span>{Number(shippingCost || 0).toLocaleString('ru-RU')} ₽</span>
            </div>

            <Separator />

            <div className="flex items-center justify-between text-lg font-semibold">
              <span>Итого</span>
              <span>{totalAmount.toLocaleString('ru-RU')} ₽</span>
            </div>
          </CardContent>
        </Card>

        {/* Notes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Примечания
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={!isAdmin}
              rows={4}
              placeholder="Комментарии к заказу"
            />
          </CardContent>
        </Card>

        {/* Order Items */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              Товары в заказе
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Add item */}
            {isAdmin && (
              <div className="flex flex-col md:flex-row gap-4 p-4 bg-muted/50 rounded-lg">
                <Popover open={productOpen} onOpenChange={setProductOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={productOpen}
                      className="flex-1 justify-between"
                    >
                      {selectedProductId
                        ? products.find((p) => Number(p.id) === selectedProductId)?.name
                        : 'Добавить товар...'}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[500px] p-0">
                    <Command>
                      <CommandInput placeholder="Поиск товара..." />
                      <CommandList>
                        <CommandEmpty>Товары не найдены</CommandEmpty>
                        <CommandGroup>
                          {products.slice(0, 50).map((product) => (
                            <CommandItem
                              key={product.id}
                              value={product.name}
                              onSelect={() => {
                                setSelectedProductId(Number(product.id));
                                setProductOpen(false);
                              }}
                            >
                              <Check
                                className={cn(
                                  'mr-2 h-4 w-4',
                                  selectedProductId === Number(product.id)
                                    ? 'opacity-100'
                                    : 'opacity-0'
                                )}
                              />
                              <div className="flex items-center gap-3">
                                {product.image && (
                                  <img
                                    src={`${API_BASE}${product.image}`}
                                    alt=""
                                    className="w-8 h-8 rounded object-cover"
                                  />
                                )}
                                <div>
                                  <p className="font-medium line-clamp-1">{product.name}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {Number(product.price).toLocaleString('ru-RU')} ₽
                                  </p>
                                </div>
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>

                <Input
                  type="number"
                  min={1}
                  value={productQuantity}
                  onChange={(e) => setProductQuantity(e.target.value)}
                  placeholder="Кол-во"
                  className="w-24"
                />

                <Button onClick={handleAddItem} disabled={!selectedProductId} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Добавить
                </Button>
              </div>
            )}

            {/* Items list */}
            {!order.items || order.items.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>Товары не найдены</p>
              </div>
            ) : (
              <div className="space-y-3">
                {order.items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-4 p-4 bg-muted/30 rounded-lg"
                  >
                    {item.product_image && (
                      <img
                        src={/^https?:\/\//.test(item.product_image) ? item.product_image : `${API_BASE}${item.product_image}`}
                        alt=""
                        className="w-16 h-16 rounded object-cover"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground">{item.product_name}</p>
                      <p className="text-sm text-muted-foreground">{item.product_sku}</p>
                      <div className="flex items-center gap-4 mt-1 text-sm">
                        <span>Цена: {item.price.toLocaleString('ru-RU')} ₽</span>
                        <span>Кол-во: {item.quantity}</span>
                        <span className="font-medium">
                          Итого: {item.line_total.toLocaleString('ru-RU')} ₽
                        </span>
                      </div>
                    </div>
                    {isAdmin && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <X className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Удалить товар?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Товар будет удалён из заказа.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Отмена</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleRemoveItem(item.id)}>
                              Удалить
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Status History */}
        {order.status_history && order.status_history.length > 0 && (
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                История статусов
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {order.status_history.map((entry, index) => (
                  <div
                    key={entry.id}
                    className="flex items-center gap-4 p-3 bg-muted/30 rounded-lg"
                  >
                    <div className="flex-1">
                      {getStatusBadge(entry.status)}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {entry.changed_by_name || entry.changed_by_email}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {new Date(entry.created_at).toLocaleString('ru-RU')}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Status change dialog */}
      <Dialog open={showStatusDialog} onOpenChange={setShowStatusDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Изменить статус заказа</DialogTitle>
            <DialogDescription>
              Текущий статус: {statusLabelsMap[order.status] || order.status}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Новый статус</Label>
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Выберите статус" />
                </SelectTrigger>
                <SelectContent>
                  {allStatuses
                    .filter((s) => s !== order.status)
                    .map((s) => (
                      <SelectItem key={s} value={s}>
                        {statusLabelsMap[s] || s}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Комментарий</Label>
              <Textarea
                value={statusNotes}
                onChange={(e) => setStatusNotes(e.target.value)}
                placeholder="Причина изменения (необязательно)"
                rows={2}
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowStatusDialog(false)}>
                Отмена
              </Button>
              <Button onClick={handleStatusChange} disabled={!newStatus || isChangingStatus}>
                {isChangingStatus && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Изменить
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
