import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import PosCheckout from '@/components/pos/PosCheckout';
import PosOrders from '@/components/pos/PosOrders';
import PosStatistics from '@/components/pos/PosStatistics';
import { Receipt, List, BarChart3 } from 'lucide-react';

export default function PosPage() {
  const [activeTab, setActiveTab] = useState('checkout');

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Касса (POS)</h1>
        <p className="text-muted-foreground">Создание чеков, просмотр заказов и статистика</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="checkout" className="gap-2">
            <Receipt className="h-4 w-4" />
            Новый чек
          </TabsTrigger>
          <TabsTrigger value="orders" className="gap-2">
            <List className="h-4 w-4" />
            Чеки
          </TabsTrigger>
          <TabsTrigger value="statistics" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            Статистика
          </TabsTrigger>
        </TabsList>

        <TabsContent value="checkout">
          <PosCheckout />
        </TabsContent>
        <TabsContent value="orders">
          <PosOrders />
        </TabsContent>
        <TabsContent value="statistics">
          <PosStatistics />
        </TabsContent>
      </Tabs>
    </div>
  );
}
