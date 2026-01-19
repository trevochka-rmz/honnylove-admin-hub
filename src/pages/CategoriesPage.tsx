import { useState, useEffect, useCallback, Fragment } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import type { Category } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { Loader2, FolderTree, Image as ImageIcon, Plus, ChevronRight, ChevronDown, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

const REFRESH_INTERVAL = 30000;

interface CategoryNode extends Category {
  isOpen?: boolean;
}

export default function CategoriesPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [categories, setCategories] = useState<CategoryNode[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());
  const [imageErrors, setImageErrors] = useState<Set<number>>(new Set());

  const loadCategories = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await api.getCategories();
      setCategories(response.data);
      // Expand all by default
      const allIds = new Set<number>();
      const collectIds = (cats: Category[]) => {
        for (const cat of cats) {
          if (cat.children && cat.children.length > 0) {
            allIds.add(cat.id);
            collectIds(cat.children);
          }
        }
      };
      collectIds(response.data);
      setExpandedIds(allIds);
    } catch (error) {
      toast({
        title: 'Ошибка загрузки',
        description: 'Не удалось загрузить категории',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  useEffect(() => {
    const interval = setInterval(loadCategories, REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, [loadCategories]);

  const toggleExpand = (id: number) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const countAllCategories = (cats: Category[]): number => {
    let count = cats.length;
    for (const cat of cats) {
      if (cat.children) {
        count += countAllCategories(cat.children);
      }
    }
    return count;
  };

  const getLevelBadgeVariant = (level: number) => {
    switch (level) {
      case 1:
        return 'default';
      case 2:
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const handleImageError = (id: number) => {
    setImageErrors((prev) => new Set(prev).add(id));
  };

  const renderCategoryRows = (categoryList: Category[], level: number = 1): React.ReactNode[] => {
    const rows: React.ReactNode[] = [];

    for (const category of categoryList) {
      const hasChildren = category.children && category.children.length > 0;
      const isExpanded = expandedIds.has(category.id);
      const hasImageError = imageErrors.has(category.id);

      rows.push(
        <TableRow
          key={category.id}
          className="cursor-pointer hover:bg-muted/50"
          onClick={() => navigate(`/categories/${category.id}`)}
        >
          <TableCell>
            <div className="w-10 h-10 rounded-lg overflow-hidden bg-muted flex-shrink-0">
              {category.image_url && !hasImageError ? (
                <img
                  src={category.image_url}
                  alt={category.name}
                  className="w-full h-full object-cover"
                  onError={() => handleImageError(category.id)}
                />
              ) : hasImageError ? (
                <div className="w-full h-full flex items-center justify-center text-amber-500 bg-amber-50 relative">
                  <ImageIcon className="h-4 w-4 text-muted-foreground/50" />
                  <AlertCircle className="h-2.5 w-2.5 absolute top-1 right-1" />
                </div>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                  <ImageIcon className="h-4 w-4" />
                </div>
              )}
            </div>
          </TableCell>
          <TableCell>
            <div
              className={cn(
                'flex items-center gap-2',
                level === 2 && 'pl-6',
                level === 3 && 'pl-12'
              )}
            >
              {hasChildren && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 p-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleExpand(category.id);
                  }}
                >
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </Button>
              )}
              {!hasChildren && level > 1 && (
                <div className="w-6 h-6 flex items-center justify-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/30" />
                </div>
              )}
              <div>
                <p className={cn(
                  'font-medium',
                  level === 1 && 'text-foreground',
                  level > 1 && 'text-muted-foreground'
                )}>
                  {category.name}
                </p>
                <p className="text-xs text-muted-foreground">/{category.slug}</p>
              </div>
            </div>
          </TableCell>
          <TableCell>
            <Badge variant={getLevelBadgeVariant(level)}>
              Уровень {level}
            </Badge>
          </TableCell>
          <TableCell>
            <span className="text-muted-foreground">{category.product_count}</span>
          </TableCell>
          <TableCell>
            {hasChildren && (
              <span className="text-muted-foreground text-sm">
                {category.children!.length} подкатегорий
              </span>
            )}
          </TableCell>
        </TableRow>
      );

      // Рекурсивно добавляем детей, если раскрыто
      if (hasChildren && isExpanded) {
        rows.push(...renderCategoryRows(category.children!, level + 1));
      }
    }

    return rows;
  };

  const totalCategories = countAllCategories(categories);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Категории</h1>
          <p className="text-muted-foreground">Всего {totalCategories} категорий</p>
        </div>
        <Button onClick={() => navigate('/categories/new')}>
          <Plus className="mr-2 h-4 w-4" />
          Добавить категорию
        </Button>
      </div>

      {/* Categories Table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : categories.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <FolderTree className="h-12 w-12 mb-4 opacity-50" />
            <p className="text-lg font-medium">Категорий пока нет</p>
            <Button className="mt-4" onClick={() => navigate('/categories/new')}>
              <Plus className="mr-2 h-4 w-4" />
              Создать первую категорию
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">Фото</TableHead>
                <TableHead>Название</TableHead>
                <TableHead className="w-24">Уровень</TableHead>
                <TableHead className="w-28">Товаров</TableHead>
                <TableHead className="w-36">Подкатегории</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {renderCategoryRows(categories)}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
