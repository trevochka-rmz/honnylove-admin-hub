import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import type { Brand } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Award, Image as ImageIcon } from 'lucide-react';

export default function BrandsPage() {
  const { toast } = useToast();
  const [brands, setBrands] = useState<Brand[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadBrands();
  }, []);

  const loadBrands = async () => {
    setIsLoading(true);
    try {
      const response = await api.getBrands();
      setBrands(response.brands);
    } catch (error) {
      toast({
        title: 'Ошибка загрузки',
        description: 'Не удалось загрузить бренды',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Бренды</h1>
        <p className="text-muted-foreground">Всего {brands.length} брендов</p>
      </div>

      {/* Brands Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : brands.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <Award className="h-12 w-12 mb-4 opacity-50" />
            <p className="text-lg font-medium">Брендов пока нет</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {brands.map((brand) => (
            <Card
              key={brand.id}
              className="group overflow-hidden transition-all duration-200 hover:shadow-card-hover hover:-translate-y-0.5"
            >
              <CardContent className="p-4">
                <div className="aspect-square rounded-lg overflow-hidden bg-muted mb-3">
                  {brand.logo ? (
                    <img
                      src={brand.logo}
                      alt={brand.name}
                      className="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                      <ImageIcon className="h-8 w-8" />
                    </div>
                  )}
                </div>
                <div className="text-center">
                  <p className="font-semibold text-foreground">{brand.name}</p>
                  <p className="text-xs text-muted-foreground">/{brand.slug}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
