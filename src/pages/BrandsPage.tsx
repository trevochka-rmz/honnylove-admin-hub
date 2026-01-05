import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import type { Brand } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
import { Loader2, Award, Image as ImageIcon, Plus, Pencil, Trash2 } from 'lucide-react';

export default function BrandsPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [brands, setBrands] = useState<Brand[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [brandToDelete, setBrandToDelete] = useState<Brand | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

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

  const handleDelete = async () => {
    if (!brandToDelete) return;
    
    setIsDeleting(true);
    setDeleteError(null);
    try {
      await api.deleteBrand(brandToDelete.id);
      toast({
        title: 'Бренд удалён',
        description: `Бренд "${brandToDelete.name}" успешно удалён`,
      });
      setDeleteDialogOpen(false);
      setBrandToDelete(null);
      loadBrands();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Не удалось удалить бренд';
      setDeleteError(message);
    } finally {
      setIsDeleting(false);
    }
  };

  const openDeleteDialog = (brand: Brand) => {
    setBrandToDelete(brand);
    setDeleteError(null);
    setDeleteDialogOpen(true);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Бренды</h1>
          <p className="text-muted-foreground">Всего {brands.length} брендов</p>
        </div>
        <Button onClick={() => navigate('/brands/new')}>
          <Plus className="mr-2 h-4 w-4" />
          Добавить бренд
        </Button>
      </div>

      {/* Brands Table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : brands.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <Award className="h-12 w-12 mb-4 opacity-50" />
            <p className="text-lg font-medium">Брендов пока нет</p>
            <Button className="mt-4" onClick={() => navigate('/brands/new')}>
              <Plus className="mr-2 h-4 w-4" />
              Создать первый бренд
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">Лого</TableHead>
                <TableHead>Название</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead className="w-24 text-right">Действия</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {brands.map((brand) => (
                <TableRow key={brand.id} className="group">
                  <TableCell>
                    <div className="w-12 h-12 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                      {brand.logo ? (
                        <img
                          src={brand.logo}
                          alt={brand.name}
                          className="w-full h-full object-contain p-1"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                          <ImageIcon className="h-5 w-5" />
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">{brand.name}</TableCell>
                  <TableCell className="text-muted-foreground">/{brand.slug}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => navigate(`/brands/${brand.id}`)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openDeleteDialog(brand)}
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
            <AlertDialogTitle>Удалить бренд?</AlertDialogTitle>
            <AlertDialogDescription>
              Вы уверены, что хотите удалить бренд "{brandToDelete?.name}"? Это действие нельзя отменить.
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
