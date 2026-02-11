import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
  BarChart3,
  Package,
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const CHART_COLORS = ['hsl(168, 76%, 36%)', 'hsl(38, 92%, 50%)'];

export default function PosStatistics() {
  const { toast } = useToast();
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [period, setPeriod] = useState<'today' | 'week' | 'month'>('today');

  const loadStats = async () => {
    setIsLoading(true);
    try {
      let res: any;
      if (period === 'today') res = await api.posToday();
      else if (period === 'week') res = await api.posThisWeek();
      else res = await api.posThisMonth();
      setStats(res.data);
    } catch (error: any) {
      toast({ title: 'Ошибка', description: error.message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, [period]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!stats) return null;

  const { summary, top_products, daily_stats } = stats;

  const paymentPieData = [
    { name: 'Наличные', value: summary.cash_orders },
    { name: 'Карта', value: summary.card_orders },
  ].filter((d) => d.value > 0);

  const dailyChartData = (daily_stats || []).map((d: any) => ({
    date: d.date?.slice(5), // MM-DD
    revenue: Number(d.daily_revenue),
    orders: d.orders_count,
  }));

  return (
    <div className="space-y-6 mt-4">
      {/* Period buttons */}
      <div className="flex gap-2">
        <Button variant={period === 'today' ? 'default' : 'outline'} onClick={() => setPeriod('today')}>
          Сегодня
        </Button>
        <Button variant={period === 'week' ? 'default' : 'outline'} onClick={() => setPeriod('week')}>
          Неделя
        </Button>
        <Button variant={period === 'month' ? 'default' : 'outline'} onClick={() => setPeriod('month')}>
          Месяц
        </Button>
      </div>

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
                <p className="text-lg font-bold">{Number(summary.total_revenue).toLocaleString('ru-RU')} ₽</p>
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
                <p className="text-xs text-muted-foreground">Заказов</p>
                <p className="text-lg font-bold">{summary.total_orders}</p>
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
                <p className="text-lg font-bold">{Number(summary.avg_order_value).toLocaleString('ru-RU')} ₽</p>
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
                <p className="text-lg font-bold">{summary.cancelled_orders}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payment breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Banknote className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Наличные</span>
            </div>
            <p className="text-2xl font-bold">{Number(summary.cash_revenue).toLocaleString('ru-RU')} ₽</p>
            <p className="text-xs text-muted-foreground">{summary.cash_orders} заказов</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <CreditCard className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Карта</span>
            </div>
            <p className="text-2xl font-bold">{Number(summary.card_revenue).toLocaleString('ru-RU')} ₽</p>
            <p className="text-xs text-muted-foreground">{summary.card_orders} заказов</p>
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
