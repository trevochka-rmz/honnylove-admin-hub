import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

import { Image as ImageIcon, Loader2, Plus, Trash2 } from 'lucide-react';

interface Banner {
  id: number;
  title: string;
  subtitle: string;
  image_url: string;
  button_text: string;
  button_link: string;
  display_order: number;
  is_active: boolean;
  preheader: string;
  created_at: string;
  updated_at: string;
}

export default function BannersPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAdmin } = useAuth();

  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const bannersQuery = useQuery({
    queryKey: ['banners'],
    queryFn: () => api.getBanners(),
    refetchOnWindowFocus: false,
  });

  const banners: Banner[] = bannersQuery.data ?? [];

  const handleDelete = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    try {
      await api.deleteBanner(deleteId);
      toast({ title: 'Удалено', description: 'Баннер удалён' });
      bannersQuery.refetch();
    } catch (e) {
      toast({
        title: 'Ошибка',
        description: e instanceof Error ? e.message : 'Не удалось удалить баннер',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
      setDeleteId(null);
    }
  };

  const getImageSrc = (src: string) => {
    if (!src) return '';
    if (src.startsWith('/')) return `${import.meta.env.VITE_API_BASE_URL}${src}`;
    return src;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Баннеры</h1>
          <p className="text-muted-foreground flex items-center gap-2">
            Всего {banners.length} баннеров
            {bannersQuery.isFetching && !bannersQuery.isLoading && (
              <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
            )}
          </p>
        </div>
        {isAdmin && (
          <Button onClick={() => navigate('/banners/new')} className="gap-2">
            <Plus className="h-4 w-4" />
            Добавить баннер
          </Button>
        )}
      </div>

      <Card>
        <CardContent className="p-0">
          {bannersQuery.isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : bannersQuery.isError ? (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
              <ImageIcon className="h-12 w-12 mb-4 opacity-50" />
              <p className="text-lg font-medium">Не удалось загрузить баннеры</p>
              <p className="text-sm">Попробуйте обновить страницу</p>
            </div>
          ) : banners.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
              <ImageIcon className="h-12 w-12 mb-4 opacity-50" />
              <p className="text-lg font-medium">Баннеры не найдены</p>
              <p className="text-sm">Добавьте первый баннер</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="w-20">Фото</TableHead>
                    <TableHead>Заголовок</TableHead>
                    <TableHead>Подзаголовок</TableHead>
                    <TableHead>Кнопка</TableHead>
                    <TableHead className="text-center">Статус</TableHead>
                    {isAdmin && <TableHead className="w-14" />}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {banners.map((banner) => (
                    <TableRow
                      key={banner.id}
                      className="group hover:bg-muted/30 cursor-pointer"
                      onClick={() => navigate(`/banners/${banner.id}`)}
                    >
                      <TableCell>
                        <div className="w-16 h-10 rounded overflow-hidden bg-muted flex-shrink-0">
                          {banner.image_url ? (
                            <img
                              src={getImageSrc(banner.image_url)}
                              alt={banner.title}
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
                        <div>
                          {banner.preheader && (
                            <p className="text-xs text-muted-foreground">{banner.preheader}</p>
                          )}
                          <p className="font-medium text-foreground">{banner.title}</p>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-[200px]">
                        <p className="text-sm text-muted-foreground line-clamp-2">{banner.subtitle}</p>
                      </TableCell>
                      <TableCell>
                        {banner.button_text && (
                          <div className="text-sm">
                            <p className="font-medium">{banner.button_text}</p>
                            <p className="text-xs text-muted-foreground">{banner.button_link}</p>
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant={banner.is_active ? 'default' : 'secondary'}>
                          {banner.is_active ? 'Активен' : 'Скрыт'}
                        </Badge>
                      </TableCell>

                      {isAdmin && (
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label="Удалить"
                            onClick={() => setDeleteId(banner.id)}
                          >
                            <Trash2 className="h-4 w-4 text-muted-foreground group-hover:text-foreground" />
                          </Button>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить баннер?</AlertDialogTitle>
            <AlertDialogDescription>
              Это действие нельзя отменить.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
