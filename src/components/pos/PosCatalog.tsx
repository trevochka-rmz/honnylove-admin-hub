import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Package, Grid3X3, ChevronLeft, ChevronRight } from 'lucide-react';

interface CatalogProduct {
  id: string;
  name: string;
  image: string;
  price: string;
  discountPrice: string | null;
  brand: string;
  inStockTotal: boolean;
  stockQuantityTotal: number;
}

interface PosCatalogProps {
  onAddToCart: (product: CatalogProduct) => void;
}

const LIMIT = 12;

export default function PosCatalog({ onAddToCart }: PosCatalogProps) {
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const res = await api.getProducts({ limit: LIMIT, page });
        setProducts(res.products || []);
        setTotalPages(res.pages || 1);
        setTotal(res.total || 0);
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, [page]);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-lg">
          <span className="flex items-center gap-2">
            <Grid3X3 className="h-5 w-5" />
            Каталог товаров
          </span>
          <span className="text-sm font-normal text-muted-foreground">
            {total} товаров
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : products.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <Package className="h-10 w-10 mb-3 opacity-40" />
            <p>Товары не найдены</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {products.map((product) => {
                const finalPrice = product.discountPrice
                  ? Number(product.discountPrice)
                  : Number(product.price);
                const hasDiscount = !!product.discountPrice;

                return (
                  <button
                    key={product.id}
                    className="group relative flex flex-col rounded-lg border bg-card p-2 text-left transition-colors hover:border-primary/50 hover:bg-muted/30 focus:outline-none focus:ring-2 focus:ring-ring"
                    onClick={() => onAddToCart(product)}
                    disabled={!product.inStock}
                  >
                    {/* Image */}
                    <div className="aspect-square w-full rounded-md bg-muted overflow-hidden mb-2">
                      {product.image ? (
                        <img
                          src={product.image}
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="h-6 w-6 text-muted-foreground" />
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <p className="text-xs text-muted-foreground truncate">{product.brand}</p>
                    <p className="text-sm font-medium leading-tight line-clamp-2 min-h-[2.5rem]">
                      {product.name}
                    </p>

                    {/* Price */}
                    <div className="mt-auto pt-1.5">
                      <span className="text-sm font-bold text-primary">
                        {finalPrice.toLocaleString('ru-RU')} ₽
                      </span>
                      {hasDiscount && (
                        <span className="ml-1.5 text-xs text-muted-foreground line-through">
                          {Number(product.price).toLocaleString('ru-RU')} ₽
                        </span>
                      )}
                    </div>

                    {/* Out of stock overlay */}
                    {!product.inStock && (
                      <div className="absolute inset-0 rounded-lg bg-background/60 flex items-center justify-center">
                        <Badge variant="secondary" className="text-xs">Нет в наличии</Badge>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4 pt-3 border-t">
                <span className="text-sm text-muted-foreground">
                  Стр. {page} из {totalPages}
                </span>
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  {/* Page numbers - show max 5 */}
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum: number;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (page <= 3) {
                      pageNum = i + 1;
                    } else if (page >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = page - 2 + i;
                    }
                    return (
                      <Button
                        key={pageNum}
                        variant={pageNum === page ? 'default' : 'outline'}
                        size="sm"
                        className="w-8 h-8 p-0"
                        onClick={() => setPage(pageNum)}
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
