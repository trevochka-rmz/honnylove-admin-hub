import { useState, useEffect } from 'react';
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { Loader2, FolderTree, Image as ImageIcon, Plus, Pencil, Trash2, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FlatCategory {
  id: number;
  name: string;
  slug: string;
  image_url: string;
  product_count: string;
  level: number;
  hasChildren: boolean;
}

export default function CategoriesPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const [flatCategories, setFlatCategories] = useState<FlatCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<FlatCategory | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    setIsLoading(true);
    try {
      const response = await api.getCategories();
      setCategories(response.data);
      setFlatCategories(flattenCategories(response.data));
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

  const flattenCategories = (cats: Category[], level = 1): FlatCategory[] => {
    const result: FlatCategory[] = [];
    
    for (const cat of cats) {
      result.push({
        id: cat.id,
        name: cat.name,
        slug: cat.slug,
        image_url: cat.image_url,
        product_count: cat.product_count,
        level,
        hasChildren: !!(cat.children && cat.children.length > 0),
      });
      
      if (cat.children && cat.children.length > 0) {
        result.push(...flattenCategories(cat.children, level + 1));
      }
    }
    
    return result;
  };

  const handleDelete = async () => {
    if (!categoryToDelete) return;
    
    setIsDeleting(true);
    setDeleteError(null);
    try {
      await api.deleteCategory(categoryToDelete.id);
      toast({
        title: 'Категория удалена',
        description: `Категория "${categoryToDelete.name}" успешно удалена`,
      });
      setDeleteDialogOpen(false);
      setCategoryToDelete(null);
      loadCategories();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Не удалось удалить категорию';
      setDeleteError(message);
    } finally {
      setIsDeleting(false);
    }
  };

  const openDeleteDialog = (category: FlatCategory) => {
    setCategoryToDelete(category);
    setDeleteError(null);
    setDeleteDialogOpen(true);
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

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Категории</h1>
          <p className="text-muted-foreground">Всего {flatCategories.length} категорий</p>
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
      ) : flatCategories.length === 0 ? (
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
                <TableHead className="w-24 text-right">Действия</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {flatCategories.map((category) => (
                <TableRow key={category.id} className="group">
                  <TableCell>
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
                  </TableCell>
                  <TableCell>
                    <div
                      className={cn(
                        'flex items-center gap-2',
                        category.level === 2 && 'pl-6',
                        category.level === 3 && 'pl-12'
                      )}
                    >
                      {category.level > 1 && (
                        <ChevronRight className="h-3 w-3 text-muted-foreground" />
                      )}
                      <div>
                        <p className={cn(
                          'font-medium',
                          category.level === 1 && 'text-foreground',
                          category.level > 1 && 'text-muted-foreground'
                        )}>
                          {category.name}
                        </p>
                        <p className="text-xs text-muted-foreground">/{category.slug}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getLevelBadgeVariant(category.level)}>
                      Уровень {category.level}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="text-muted-foreground">{category.product_count}</span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => navigate(`/categories/${category.id}`)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openDeleteDialog(category)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить категорию?</AlertDialogTitle>
            <AlertDialogDescription>
              Вы уверены, что хотите удалить категорию "{categoryToDelete?.name}"? 
              {categoryToDelete?.hasChildren && ' Все подкатегории также будут удалены.'}
              {' '}Это действие нельзя отменить.
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          {deleteError && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 text-sm text-destructive">
              <p className="font-medium mb-1">Невозможно удалить</p>
              <p>{deleteError}</p>
            </div>
          )}

          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteError(null)}>Отмена</AlertDialogCancel>
            {!deleteError && (
              <AlertDialogAction
                onClick={handleDelete}
                disabled={isDeleting}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {isDeleting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="mr-2 h-4 w-4" />
                )}
                Удалить
              </AlertDialogAction>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
