import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import type { Category } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Loader2, FolderTree, ChevronRight, ChevronDown, Image as ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CategoryItemProps {
  category: Category;
  level?: number;
}

function CategoryItem({ category, level = 0 }: CategoryItemProps) {
  const [isOpen, setIsOpen] = useState(level < 2);
  const hasChildren = category.children && category.children.length > 0;

  return (
    <div className={cn('animate-fade-in', level > 0 && 'ml-6')}>
      <div
        className={cn(
          'flex items-center gap-3 p-3 rounded-lg transition-colors cursor-pointer group',
          'hover:bg-muted/50',
          level === 0 && 'bg-card border border-border shadow-card mb-2'
        )}
        onClick={() => hasChildren && setIsOpen(!isOpen)}
      >
        {hasChildren && (
          <button className="p-0.5 text-muted-foreground hover:text-foreground">
            {isOpen ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </button>
        )}
        {!hasChildren && <div className="w-5" />}

        <div className="w-10 h-10 rounded-lg overflow-hidden bg-muted flex-shrink-0">
          {category.image_url ? (
            <img
              src={category.image_url}
              alt={category.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
              <ImageIcon className="h-4 w-4" />
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <p className={cn('font-medium text-foreground truncate', level === 0 && 'text-lg')}>
            {category.name}
          </p>
          <p className="text-xs text-muted-foreground">/{category.slug}</p>
        </div>

        <Badge variant="secondary" className="flex-shrink-0">
          {category.product_count} товаров
        </Badge>
      </div>

      {hasChildren && isOpen && (
        <div className="mt-1 border-l-2 border-border/50 pl-2">
          {category.children!.map((child) => (
            <CategoryItem key={child.id} category={child} level={level + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function CategoriesPage() {
  const { toast } = useToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    setIsLoading(true);
    try {
      const response = await api.getCategories();
      setCategories(response.data);
    } catch (error) {
      toast({
        title: 'Ошибка загрузки',
        description: 'Не удалось загрузить категории',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const countAllCategories = (cats: Category[]): number => {
    return cats.reduce((sum, cat) => {
      return sum + 1 + (cat.children ? countAllCategories(cat.children) : 0);
    }, 0);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Категории</h1>
        <p className="text-muted-foreground">
          Всего {countAllCategories(categories)} категорий
        </p>
      </div>

      {/* Categories List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : categories.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <FolderTree className="h-12 w-12 mb-4 opacity-50" />
            <p className="text-lg font-medium">Категорий пока нет</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {categories.map((category) => (
            <CategoryItem key={category.id} category={category} />
          ))}
        </div>
      )}
    </div>
  );
}
