import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
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
  Loader2,
  TrendingUp,
  ShoppingCart,
  DollarSign,
  CreditCard,
  Banknote,
  Smartphone,
  BarChart3,
  Package,
  Users,
  CalendarIcon,
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function PosStatistics() {
  const { toast } = useToast();
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [period, setPeriod] = useState<'today' | 'week' | 'month' | 'custom'>('today');
  const [source, setSource] = useState<'all' | 'pos' | 'website'>('all');
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();

  const loadStats = async () => {
    setIsLoading(true);
    try {
      const filters: any = {};
      if (source !== 'all') filters.order_source = source;
      if (period === 'today') filters.today_only = true;
      else if (period === 'week') filters.this_week = true;
      else if (period === 'month') filters.this_month = true;
      else if (period === 'custom') {
        if (dateFrom) filters.date_from = format(dateFrom, 'yyyy-MM-dd');
        if (dateTo) filters.date_to = format(dateTo, 'yyyy-MM-dd');
      }
      const res = await api.getSalesReport(filters);
      setStats(res.data || res);
    } catch (error: any) {
      toast({ title: 'Ошибка', description: error.message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period, source, dateFrom, dateTo]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!stats) return null;

  const { summary, top_products, daily_stats, cashiers } = stats;
  const s = summary || {};

  const dailyChartData = (daily_stats || []).map((d: any) => ({
    date: d.date?.slice(5), // MM-DD
    revenue: Number(d.daily_revenue),
    orders: d.orders_count,
  }));

  return (
    <div className="space-y-6 mt-4">
      {/* Filters */}
      <Card>
        <CardContent className="p-4 flex flex-col md:flex-row md:items-center gap-3 flex-wrap">
          <div className="flex gap-2 flex-wrap">
            <Button size="sm" variant={period === 'today' ? 'default' : 'outline'} onClick={() => setPeriod('today')}>Сегодня</Button>
            <Button size="sm" variant={period === 'week' ? 'default' : 'outline'} onClick={() => setPeriod('week')}>Неделя</Button>
            <Button size="sm" variant={period === 'month' ? 'default' : 'outline'} onClick={() => setPeriod('month')}>Месяц</Button>
            <Button size="sm" variant={period === 'custom' ? 'default' : 'outline'} onClick={() => setPeriod('custom')}>Свой диапазон</Button>
          </div>
          <Select value={source} onValueChange={(v) => setSource(v as any)}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все продажи</SelectItem>
              <SelectItem value="pos">Касса</SelectItem>
              <SelectItem value="website">Сайт</SelectItem>
            </SelectContent>
          </Select>
          {period === 'custom' && (
            <div className="flex gap-2 flex-wrap">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className={cn(!dateFrom && 'text-muted-foreground')}>
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
                  <Button variant="outline" size="sm" className={cn(!dateTo && 'text-muted-foreground')}>
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

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <DollarSign className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Выручка</p>
                <p className="text-lg font-bold">{Number(s.total_revenue || 0).toLocaleString('ru-RU')} ₽</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <ShoppingCart className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Продаж</p>
                <p className="text-lg font-bold">{s.total_orders || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <TrendingUp className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Средний чек</p>
                <p className="text-lg font-bold">{Number(s.avg_order_value || 0).toLocaleString('ru-RU')} ₽</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-destructive/10">
                <ShoppingCart className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Отменено</p>
                <p className="text-lg font-bold">{s.cancelled_orders || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payment breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Banknote className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Наличные</span>
            </div>
            <p className="text-2xl font-bold">{Number(s.cash_revenue || 0).toLocaleString('ru-RU')} ₽</p>
            <p className="text-xs text-muted-foreground">{s.cash_orders || 0} продаж</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <CreditCard className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Карта</span>
            </div>
            <p className="text-2xl font-bold">{Number(s.card_revenue || 0).toLocaleString('ru-RU')} ₽</p>
            <p className="text-xs text-muted-foreground">{s.card_orders || 0} продаж</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Smartphone className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">СБП</span>
            </div>
            <p className="text-2xl font-bold">{Number(s.sbp_revenue || 0).toLocaleString('ru-RU')} ₽</p>
            <p className="text-xs text-muted-foreground">{s.sbp_orders || 0} продаж</p>
          </CardContent>
        </Card>
      </div>

      {/* Revenue chart */}
      {dailyChartData.length > 1 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Выручка по дням
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dailyChartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="date" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip
                    formatter={(value: number) => [`${value.toLocaleString('ru-RU')} ₽`, 'Выручка']}
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Bar dataKey="revenue" fill="hsl(168, 76%, 36%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cashier stats */}
      {cashiers && cashiers.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-4 w-4" />
              Кассиры
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Кассир</TableHead>
                  <TableHead className="text-center">Продаж</TableHead>
                  <TableHead className="text-right">Выручка</TableHead>
                  <TableHead className="text-right">Средний чек</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cashiers.map((c: any) => (
                  <TableRow key={c.id || c.cashier_id}>
                    <TableCell>
                      <p className="font-medium text-sm">
                        {c.first_name ? `${c.first_name} ${c.last_name || ''}`.trim() : c.email}
                      </p>
                      <p className="text-xs text-muted-foreground">{c.email}</p>
                    </TableCell>
                    <TableCell className="text-center">{c.total_orders || c.orders_count || 0}</TableCell>
                    <TableCell className="text-right font-semibold">
                      {Number(c.total_revenue || 0).toLocaleString('ru-RU')} ₽
                    </TableCell>
                    <TableCell className="text-right">
                      {Number(c.avg_order_value || 0).toLocaleString('ru-RU')} ₽
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Top products */}
      {top_products && top_products.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Package className="h-4 w-4" />
              Топ товаров
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>#</TableHead>
                  <TableHead>Товар</TableHead>
                  <TableHead className="text-center">Заказов</TableHead>
                  <TableHead className="text-center">Продано</TableHead>
                  <TableHead className="text-right">Выручка</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {top_products.map((product: any, idx: number) => (
                  <TableRow key={product.id}>
                    <TableCell className="font-medium">{idx + 1}</TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium text-sm truncate max-w-[250px]">{product.name}</p>
                        <p className="text-xs text-muted-foreground">{product.sku}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">{product.times_ordered}</TableCell>
                    <TableCell className="text-center">{product.total_quantity_sold}</TableCell>
                    <TableCell className="text-right font-semibold">
                      {Number(product.total_revenue).toLocaleString('ru-RU')} ₽
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
