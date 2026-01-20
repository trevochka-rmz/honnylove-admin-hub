import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
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
import { Loader2, ArrowLeft, Save, Trash2 } from 'lucide-react';
import { ImageUpload } from '@/components/ImageUpload';

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

export default function BannerEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const isNew = id === 'new';
  const isAdmin = user?.role === 'admin';

  const [isLoading, setIsLoading] = useState(!isNew);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [banner, setBanner] = useState<Banner | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);

  const [formData, setFormData] = useState({
    preheader: '',
    title: '',
    subtitle: '',
    button_text: '',
    button_link: '',
    is_active: true,
  });

  useEffect(() => {
    if (!isNew && id) {
      loadBanner(parseInt(id));
    }
  }, [id, isNew]);

  const loadBanner = async (bannerId: number) => {
    setIsLoading(true);
    try {
      const banners = await api.getBanners();
      const data = banners.find((b: Banner) => b.id === bannerId);
      if (!data) throw new Error('Баннер не найден');
      
      setBanner(data);
      setFormData({
        preheader: data.preheader || '',
        title: data.title || '',
        subtitle: data.subtitle || '',
        button_text: data.button_text || '',
        button_link: data.button_link || '',
        is_active: data.is_active ?? true,
      });
    } catch (error) {
      toast({
        title: 'Ошибка загрузки',
        description: 'Не удалось загрузить баннер',
        variant: 'destructive',
      });
      navigate('/banners');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      toast({
        title: 'Ошибка',
        description: 'Заголовок обязателен',
        variant: 'destructive',
      });
      return;
    }

    setIsSaving(true);
    try {
      const fd = new FormData();
      fd.append('title', formData.title);
      if (formData.preheader) fd.append('preheader', formData.preheader);
      if (formData.subtitle) fd.append('subtitle', formData.subtitle);
      if (formData.button_text) fd.append('button_text', formData.button_text);
      if (formData.button_link) fd.append('button_link', formData.button_link);
      fd.append('is_active', formData.is_active.toString());
      
      if (imageFile) {
        fd.append('image', imageFile);
      }

      if (isNew) {
        await api.createBanner(fd);
        toast({
          title: 'Баннер создан',
          description: 'Баннер успешно создан',
        });
      } else if (id) {
        await api.updateBanner(parseInt(id), fd);
        toast({
          title: 'Баннер обновлён',
          description: 'Изменения сохранены',
        });
      }
      navigate('/banners');
    } catch (error) {
      toast({
        title: 'Ошибка сохранения',
        description: error instanceof Error ? error.message : 'Не удалось сохранить баннер',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!id || isNew) return;
    
    setIsDeleting(true);
    try {
      await api.deleteBanner(parseInt(id));
      toast({
        title: 'Баннер удалён',
        description: 'Баннер успешно удалён',
      });
      navigate('/banners');
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: error instanceof Error ? error.message : 'Не удалось удалить баннер',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/banners')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {isNew ? 'Новый баннер' : `Редактирование: ${banner?.title}`}
            </h1>
          </div>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-2">
          {!isNew && isAdmin && (
            <Button
              variant="destructive"
              onClick={() => setDeleteDialogOpen(true)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Удалить
            </Button>
          )}
          <Button onClick={handleSubmit} disabled={isSaving}>
            {isSaving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            {isNew ? 'Создать' : 'Сохранить'}
          </Button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Info */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Основная информация</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="preheader">Предзаголовок</Label>
                <Input
                  id="preheader"
                  value={formData.preheader}
                  onChange={(e) => handleChange('preheader', e.target.value)}
                  placeholder="Текст над заголовком"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="title">Заголовок *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleChange('title', e.target.value)}
                  placeholder="Главный заголовок баннера"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="subtitle">Подзаголовок</Label>
                <Textarea
                  id="subtitle"
                  value={formData.subtitle}
                  onChange={(e) => handleChange('subtitle', e.target.value)}
                  placeholder="Описание или подзаголовок"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="button_text">Текст кнопки</Label>
                  <Input
                    id="button_text"
                    value={formData.button_text}
                    onChange={(e) => handleChange('button_text', e.target.value)}
                    placeholder="Перейти"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="button_link">Ссылка кнопки</Label>
                  <Input
                    id="button_link"
                    value={formData.button_link}
                    onChange={(e) => handleChange('button_link', e.target.value)}
                    placeholder="/catalog"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Side Info */}
          <div className="space-y-6">
            {/* Image Upload */}
            <Card>
              <CardHeader>
                <CardTitle>Изображение</CardTitle>
              </CardHeader>
              <CardContent>
                <ImageUpload
                  value={banner?.image_url}
                  onChange={setImageFile}
                  aspectRatio="video"
                />
              </CardContent>
            </Card>

            {/* Status */}
            <Card>
              <CardHeader>
                <CardTitle>Статус</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="is_active">Активен</Label>
                  <Switch
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => handleChange('is_active', checked)}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить баннер?</AlertDialogTitle>
            <AlertDialogDescription>
              Вы уверены, что хотите удалить этот баннер? Это действие нельзя отменить.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
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
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
