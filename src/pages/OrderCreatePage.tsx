import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import type { User, Product } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { ArrowLeft, Loader2, Save, Plus, X, Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface OrderItemInput {
  product_id: number;
  product_name: string;
  quantity: number;
}

const API_BASE = import.meta.env.VITE_API_BASE_URL;

export default function OrderCreatePage() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [users, setUsers] = useState<User[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItemInput[]>([]);
  const [shippingAddress, setShippingAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [notes, setNotes] = useState('');
  const [shippingCost, setShippingCost] = useState('');
  const [taxAmount, setTaxAmount] = useState('');
  const [discountAmount, setDiscountAmount] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');

  // User combobox
  const [userOpen, setUserOpen] = useState(false);
  // Product combobox
  const [productOpen, setProductOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const [productQuantity, setProductQuantity] = useState('1');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [usersData, productsData] = await Promise.all([
        api.getUsers(),
        api.getProducts({ limit: 500 }),
      ]);
      setUsers(usersData);
      setProducts(productsData.products);

      // Set default address from first user if exists
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось загрузить данные',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUserSelect = (userId: number) => {
    setSelectedUserId(userId);
    const user = users.find((u) => u.id === userId);
    if (user?.address) {
      setShippingAddress(user.address);
    }
    setUserOpen(false);
  };

  const addProduct = () => {
    if (!selectedProductId) return;
    const product = products.find((p) => Number(p.id) === selectedProductId);
    if (!product) return;

    // Check if already added
    const existing = orderItems.find((item) => item.product_id === selectedProductId);
    if (existing) {
      setOrderItems((prev) =>
        prev.map((item) =>
          item.product_id === selectedProductId
            ? { ...item, quantity: item.quantity + (Number(productQuantity) || 1) }
            : item
        )
      );
    } else {
      setOrderItems((prev) => [
        ...prev,
        {
          product_id: selectedProductId,
          product_name: product.name,
          quantity: Number(productQuantity) || 1,
        },
      ]);
    }
    setSelectedProductId(null);
    setProductQuantity('1');
    setProductOpen(false);
  };

  const removeProduct = (productId: number) => {
    setOrderItems((prev) => prev.filter((item) => item.product_id !== productId));
  };

  const updateQuantity = (productId: number, quantity: number) => {
    if (quantity < 1) return;
    setOrderItems((prev) =>
      prev.map((item) => (item.product_id === productId ? { ...item, quantity } : item))
    );
  };

  const handleSubmit = async () => {
    if (!selectedUserId) {
      toast({ title: 'Ошибка', description: 'Выберите пользователя', variant: 'destructive' });
      return;
    }
    if (orderItems.length === 0) {
      toast({ title: 'Ошибка', description: 'Добавьте хотя бы один товар', variant: 'destructive' });
      return;
    }
    if (!shippingAddress.trim()) {
      toast({ title: 'Ошибка', description: 'Укажите адрес доставки', variant: 'destructive' });
      return;
    }

    setIsSaving(true);
    try {
      await api.createOrder({
        user_id: selectedUserId,
        items: orderItems.map((item) => ({
          product_id: item.product_id,
          quantity: item.quantity,
        })),
        shipping_address: shippingAddress,
        payment_method: paymentMethod,
        notes: notes || undefined,
        shipping_cost: shippingCost ? Number(shippingCost) : undefined,
        tax_amount: taxAmount ? Number(taxAmount) : undefined,
        discount_amount: discountAmount ? Number(discountAmount) : undefined,
        tracking_number: trackingNumber || undefined,
      });

      toast({ title: 'Успешно', description: 'Заказ создан' });
      navigate('/orders');
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: error instanceof Error ? error.message : 'Не удалось создать заказ',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const selectedUser = users.find((u) => u.id === selectedUserId);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/orders')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-foreground">Новый заказ</h1>
          <p className="text-muted-foreground">Создание заказа вручную</p>
        </div>
        <Button onClick={handleSubmit} disabled={isSaving} className="gap-2">
          {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Создать заказ
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User selection */}
        <Card>
          <CardHeader>
            <CardTitle>Пользователь *</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Popover open={userOpen} onOpenChange={setUserOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={userOpen}
                  className="w-full justify-between"
                >
                  {selectedUser
                    ? `${selectedUser.first_name || ''} ${selectedUser.last_name || ''} (${selectedUser.email})`.trim()
                    : 'Выберите пользователя...'}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[400px] p-0">
                <Command>
                  <CommandInput placeholder="Поиск по имени или email..." />
                  <CommandList>
                    <CommandEmpty>Пользователи не найдены</CommandEmpty>
                    <CommandGroup>
                      {users.map((user) => (
                        <CommandItem
                          key={user.id}
                          value={`${user.first_name} ${user.last_name} ${user.email}`}
                          onSelect={() => handleUserSelect(user.id)}
                        >
                          <Check
                            className={cn(
                              'mr-2 h-4 w-4',
                              selectedUserId === user.id ? 'opacity-100' : 'opacity-0'
                            )}
                          />
                          <div>
                            <p className="font-medium">
                              {user.first_name || user.last_name
                                ? `${user.first_name || ''} ${user.last_name || ''}`.trim()
                                : user.username}
                            </p>
                            <p className="text-xs text-muted-foreground">{user.email}</p>
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>

            {selectedUser && (
              <div className="p-3 bg-muted rounded-lg text-sm">
                <p>
                  <strong>Email:</strong> {selectedUser.email}
                </p>
                {selectedUser.phone && (
                  <p>
                    <strong>Телефон:</strong> {selectedUser.phone}
                  </p>
                )}
                {selectedUser.address && (
                  <p>
                    <strong>Адрес:</strong> {selectedUser.address}
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Shipping & Payment */}
        <Card>
          <CardHeader>
            <CardTitle>Доставка и оплата</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="address">Адрес доставки *</Label>
              <Textarea
                id="address"
                value={shippingAddress}
                onChange={(e) => setShippingAddress(e.target.value)}
                placeholder="Город, улица, дом, квартира"
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label>Способ оплаты *</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="card">Карта</SelectItem>
                  <SelectItem value="cash">Наличные</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="shipping_cost">Доставка (₽)</Label>
                <Input
                  id="shipping_cost"
                  type="number"
                  value={shippingCost}
                  onChange={(e) => setShippingCost(e.target.value)}
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="discount">Скидка (₽)</Label>
                <Input
                  id="discount"
                  type="number"
                  value={discountAmount}
                  onChange={(e) => setDiscountAmount(e.target.value)}
                  placeholder="0"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tracking">Трек-номер</Label>
              <Input
                id="tracking"
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                placeholder="TRACK123456"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Примечания</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Комментарии к заказу"
                rows={2}
              />
            </div>
          </CardContent>
        </Card>

        {/* Products */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Товары *</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Add product */}
            <div className="flex flex-col md:flex-row gap-4">
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
                      : 'Выберите товар...'}
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
                                selectedProductId === Number(product.id) ? 'opacity-100' : 'opacity-0'
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

              <Button onClick={addProduct} disabled={!selectedProductId} className="gap-2">
                <Plus className="h-4 w-4" />
                Добавить
              </Button>
            </div>

            {/* Products list */}
            {orderItems.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>Товары не добавлены</p>
              </div>
            ) : (
              <div className="space-y-2">
                {orderItems.map((item) => {
                  const product = products.find((p) => Number(p.id) === item.product_id);
                  return (
                    <div
                      key={item.product_id}
                      className="flex items-center gap-4 p-3 bg-muted/50 rounded-lg"
                    >
                      {product?.image && (
                        <img
                          src={`${API_BASE}${product.image}`}
                          alt=""
                          className="w-12 h-12 rounded object-cover"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground line-clamp-1">{item.product_name}</p>
                        {product && (
                          <p className="text-sm text-muted-foreground">
                            {Number(product.price).toLocaleString('ru-RU')} ₽
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          min={1}
                          value={item.quantity}
                          onChange={(e) => updateQuantity(item.product_id, Number(e.target.value))}
                          className="w-20 text-center"
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeProduct(item.product_id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
