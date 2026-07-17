import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
  Search,
  Plus,
  Minus,
  Trash2,
  Loader2,
  ShoppingCart,
  CheckCircle,
  Package,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import PosCatalog from './PosCatalog';
import { CalendarIcon } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Switch } from '@/components/ui/switch';

interface CartItem {
  product_id: number;
  name: string;
  image: string;
  price: number;
  quantity: number;
  available_stock: number;
}

interface SearchProduct {
  id: string;
  name: string;
  image: string;
  price: string;
  discountPrice: string | null;
  brand: string;
  inStockTotal: boolean;
  stockQuantityTotal: number;
}

export default function PosCheckout() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebouncedValue(searchTerm, 300);
  const [searchResults, setSearchResults] = useState<SearchProduct[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'sbp'>('cash');
  const [customerFirstName, setCustomerFirstName] = useState('');
  const [customerLastName, setCustomerLastName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [discountAmount, setDiscountAmount] = useState('0');
  const [useBackdate, setUseBackdate] = useState(false);
  const [saleDate, setSaleDate] = useState<Date | undefined>(new Date());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [receiptDialog, setReceiptDialog] = useState<any>(null);

  // Search products
  useEffect(() => {
    if (!debouncedSearch || debouncedSearch.length < 2) {
      setSearchResults([]);
      return;
    }
    const search = async () => {
      setIsSearching(true);
      try {
        const res = await api.getProducts({ limit: 10, page: 1, search: debouncedSearch });
        setSearchResults(res.products || []);
      } catch {
        // ignore
      } finally {
        setIsSearching(false);
      }
    };
    search();
  }, [debouncedSearch]);

  const addToCart = (product: SearchProduct) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product_id === Number(product.id));
      if (existing) {
        return prev.map((item) =>
          item.product_id === Number(product.id)
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [
        ...prev,
        {
          product_id: Number(product.id),
          name: product.name,
          image: product.image,
          price: product.discountPrice ? Number(product.discountPrice) : Number(product.price),
          quantity: 1,
          available_stock: product.stockQuantityTotal ?? 999,
        },
      ];
    });
    setSearchTerm('');
    setSearchResults([]);
  };

  const updateQuantity = (productId: number, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) =>
          item.product_id === productId
            ? { ...item, quantity: Math.max(0, item.quantity + delta) }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const removeFromCart = (productId: number) => {
    setCart((prev) => prev.filter((item) => item.product_id !== productId));
  };

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  const handleCheckout = async () => {
    if (cart.length === 0) {
      toast({ title: 'Корзина пуста', variant: 'destructive' });
      return;
    }
    setIsSubmitting(true);
    try {
      const data: any = {
        items: cart.map((item) => ({ product_id: item.product_id, quantity: item.quantity })),
        payment_method: paymentMethod,
      };
      if (customerFirstName) data.customer_first_name = customerFirstName;
      if (customerLastName) data.customer_last_name = customerLastName;
      if (customerPhone) data.customer_phone = customerPhone;
      if (notes) data.notes = notes;
      const discount = Number(discountAmount) || 0;
      if (discount > 0) data.discount_amount = discount;
      if (useBackdate && saleDate) {
        data.sale_date = format(saleDate, 'yyyy-MM-dd HH:mm:ss');
      }

      const result = await api.salesCheckout(data);
      setReceiptDialog(result.data);
      setCart([]);
      setCustomerFirstName('');
      setCustomerLastName('');
      setCustomerPhone('');
      setNotes('');
      setDiscountAmount('0');
      toast({ title: 'Успешно', description: 'Продажа создана' });
    } catch (error: any) {
      toast({ title: 'Ошибка', description: error.message, variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-4">
      {/* Left - Product search + cart */}
      <div className="lg:col-span-2 space-y-4">
        {/* Search */}
        <Card>
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Поиск товара по названию, бренду или SKU..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
              {isSearching && (
                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
              )}
            </div>

            {/* Search results dropdown */}
            {searchResults.length > 0 && (
              <div className="mt-2 border rounded-lg max-h-64 overflow-y-auto">
                {searchResults.map((product) => (
                  <button
                    key={product.id}
                    className="w-full flex items-center gap-3 p-3 hover:bg-muted/50 transition-colors text-left border-b last:border-b-0"
                    onClick={() => addToCart(product)}
                  >
                    <div className="w-10 h-10 rounded bg-muted overflow-hidden flex-shrink-0">
                      {product.image ? (
                        <img src={product.image} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="h-4 w-4 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{product.name}</p>
                      <p className="text-xs text-muted-foreground">{product.brand}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-semibold">
                        {product.discountPrice
                          ? Number(product.discountPrice).toLocaleString('ru-RU')
                          : Number(product.price).toLocaleString('ru-RU')}{' '}
                        ₽
                      </p>
                      {product.discountPrice && (
                        <p className="text-xs text-muted-foreground line-through">
                          {Number(product.price).toLocaleString('ru-RU')} ₽
                        </p>
                      )}
                    </div>
                    <Plus className="h-5 w-5 text-primary flex-shrink-0" />
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Cart */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <ShoppingCart className="h-5 w-5" />
              Корзина
              {cart.length > 0 && (
                <Badge variant="secondary">{totalItems} шт.</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <ShoppingCart className="h-10 w-10 mb-3 opacity-40" />
                <p>Корзина пуста</p>
                <p className="text-sm">Найдите товар через поиск</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>Товар</TableHead>
                    <TableHead className="text-center w-36">Кол-во</TableHead>
                    <TableHead className="text-right">Цена</TableHead>
                    <TableHead className="text-right">Сумма</TableHead>
                    <TableHead className="w-10" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cart.map((item) => (
                    <TableRow key={item.product_id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded bg-muted overflow-hidden flex-shrink-0">
                            {item.image ? (
                              <img src={item.image} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Package className="h-3 w-3 text-muted-foreground" />
                              </div>
                            )}
                          </div>
                          <span className="text-sm font-medium truncate max-w-[200px]">{item.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => updateQuantity(item.product_id, -1)}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-8 text-center font-medium text-sm">{item.quantity}</span>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => updateQuantity(item.product_id, 1)}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell className="text-right text-sm">
                        {item.price.toLocaleString('ru-RU')} ₽
                      </TableCell>
                      <TableCell className="text-right font-semibold text-sm">
                        {(item.price * item.quantity).toLocaleString('ru-RU')} ₽
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive hover:text-destructive"
                          onClick={() => removeFromCart(item.product_id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Product catalog browsing */}
        <PosCatalog onAddToCart={addToCart} />
      </div>

      {/* Right - Payment info */}
      <div className="space-y-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Оплата</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Способ оплаты *</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
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

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-2">
                <Label>Имя клиента</Label>
                <Input
                  placeholder="Необязательно"
                  value={customerFirstName}
                  onChange={(e) => setCustomerFirstName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Фамилия</Label>
                <Input
                  placeholder="Необязательно"
                  value={customerLastName}
                  onChange={(e) => setCustomerLastName(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Телефон клиента</Label>
              <Input
                placeholder="Необязательно"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Скидка (₽)</Label>
              <Input
                type="number"
                min="0"
                value={discountAmount}
                onChange={(e) => setDiscountAmount(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Заметка</Label>
              <Textarea
                placeholder="Необязательно"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
              />
            </div>

            <div className="space-y-2 pt-2 border-t">
              <div className="flex items-center justify-between">
                <Label className="cursor-pointer" htmlFor="backdate-switch">Задним числом</Label>
                <Switch
                  id="backdate-switch"
                  checked={useBackdate}
                  onCheckedChange={setUseBackdate}
                />
              </div>
              {useBackdate && (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn('w-full justify-start text-left font-normal', !saleDate && 'text-muted-foreground')}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {saleDate ? format(saleDate, 'dd.MM.yyyy') : 'Выберите дату'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={saleDate}
                      onSelect={setSaleDate}
                      disabled={(d) => d > new Date()}
                      initialFocus
                      className={cn('p-3 pointer-events-auto')}
                    />
                  </PopoverContent>
                </Popover>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Total */}
        <Card className="border-primary/30">
          <CardContent className="p-4 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Товаров:</span>
              <span>{totalItems} шт.</span>
            </div>
            {Number(discountAmount) > 0 && (
              <div className="flex justify-between text-sm text-destructive">
                <span>Скидка:</span>
                <span>-{Number(discountAmount).toLocaleString('ru-RU')} ₽</span>
              </div>
            )}
            <div className="flex justify-between text-lg font-bold">
              <span>Итого:</span>
              <span className="text-primary">
                {Math.max(0, total - (Number(discountAmount) || 0)).toLocaleString('ru-RU')} ₽
              </span>
            </div>
            <Button
              className="w-full"
              size="lg"
              onClick={handleCheckout}
              disabled={cart.length === 0 || isSubmitting}
            >
              {isSubmitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle className="mr-2 h-4 w-4" />
              )}
              Создать продажу
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Receipt dialog */}
      <Dialog open={!!receiptDialog} onOpenChange={() => setReceiptDialog(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-primary" />
              Продажа создана
            </DialogTitle>
            <DialogDescription>
              Продажа #{receiptDialog?.receipt_number || receiptDialog?.id}
            </DialogDescription>
          </DialogHeader>
          {receiptDialog && (
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Номер:</span>
                <span className="font-medium">{receiptDialog.receipt_number || receiptDialog.id}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Позиций:</span>
                <span>{receiptDialog.items_count}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Кол-во товаров:</span>
                <span>{receiptDialog.total_quantity}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Оплата:</span>
                <span>{paymentLabel(receiptDialog.payment_method)}</span>
              </div>
              {receiptDialog.discount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Скидка:</span>
                  <span className="text-destructive">-{receiptDialog.discount.toLocaleString('ru-RU')} ₽</span>
                </div>
              )}
              <div className="border-t pt-2 flex justify-between text-lg font-bold">
                <span>Итого:</span>
                <span className="text-primary">{Number(receiptDialog.total).toLocaleString('ru-RU')} ₽</span>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setReceiptDialog(null)}>Закрыть</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function paymentLabel(m: string): string {
  if (m === 'cash') return 'Наличные';
  if (m === 'card') return 'Карта';
  if (m === 'sbp') return 'СБП';
  return m;
}
