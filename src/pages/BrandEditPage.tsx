import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import type { BrandDetail } from '@/types';
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
import { Loader2, ArrowLeft, Save, Trash2, Plus, X } from 'lucide-react';
import { ImageUpload } from '@/components/ImageUpload';

export default function BrandEditPage() {
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
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [brand, setBrand] = useState<BrandDetail | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    full_description: '',
    website: '',
    country: '',
    founded: '',
    philosophy: '',
    highlights: [] as string[],
    is_active: true,
  });

  const [newHighlight, setNewHighlight] = useState('');

  useEffect(() => {
    if (!isNew && id) {
      loadBrand(parseInt(id));
    }
  }, [id, isNew]);

  const loadBrand = async (brandId: number) => {
    setIsLoading(true);
    try {
      const data = await api.getBrand(brandId);
      setBrand(data);
      setFormData({
        name: data.name || '',
        description: data.description || '',
        full_description: data.fullDescription || '',
        website: data.website || '',
        country: data.country || '',
        founded: data.founded || '',
        philosophy: data.philosophy || '',
        highlights: data.highlights || [],
        is_active: data.is_active ?? true,
      });
    } catch (error) {
      toast({
        title: 'Ошибка загрузки',
        description: 'Не удалось загрузить бренд',
        variant: 'destructive',
      });
      navigate('/brands');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (field: string, value: string | boolean | string[]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const addHighlight = () => {
    if (newHighlight.trim()) {
      setFormData((prev) => ({
        ...prev,
        highlights: [...prev.highlights, newHighlight.trim()],
      }));
      setNewHighlight('');
    }
  };

  const removeHighlight = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      highlights: prev.highlights.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast({
        title: 'Ошибка',
        description: 'Название бренда обязательно',
        variant: 'destructive',
      });
      return;
    }

    setIsSaving(true);
    try {
      const fd = new FormData();
      fd.append('name', formData.name);
      if (formData.description) fd.append('description', formData.description);
      if (formData.full_description) fd.append('full_description', formData.full_description);
      if (formData.website) fd.append('website', formData.website);
      if (formData.country) fd.append('country', formData.country);
      if (formData.founded) fd.append('founded', formData.founded);
      if (formData.philosophy) fd.append('philosophy', formData.philosophy);
      fd.append('is_active', formData.is_active.toString());
      
      if (formData.highlights.length > 0) {
        fd.append('highlights', JSON.stringify(formData.highlights));
      }

      if (logoFile) {
        fd.append('logo', logoFile);
      }

      if (isNew) {
        await api.createBrand(fd);
        toast({
          title: 'Бренд создан',
          description: 'Бренд успешно создан',
        });
      } else if (id) {
        await api.updateBrand(parseInt(id), fd);
        toast({
          title: 'Бренд обновлён',
          description: 'Изменения сохранены',
        });
      }
      navigate('/brands');
    } catch (error) {
      toast({
        title: 'Ошибка сохранения',
        description: error instanceof Error ? error.message : 'Не удалось сохранить бренд',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!id || isNew) return;
    
    setIsDeleting(true);
    setDeleteError(null);
    try {
      await api.deleteBrand(parseInt(id));
      toast({
        title: 'Бренд удалён',
        description: `Бренд "${brand?.name}" успешно удалён`,
      });
      navigate('/brands');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Не удалось удалить бренд';
      setDeleteError(message);
    } finally {
      setIsDeleting(false);
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
          <Button variant="ghost" size="icon" onClick={() => navigate('/brands')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {isNew ? 'Новый бренд' : `Редактирование: ${brand?.name}`}
            </h1>
            {!isNew && brand && (
              <p className="text-muted-foreground">/{brand.slug}</p>
            )}
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
                <Label htmlFor="name">Название *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  placeholder="Название бренда"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Краткое описание</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  placeholder="Краткое описание бренда"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="full_description">Полное описание</Label>
                <Textarea
                  id="full_description"
                  value={formData.full_description}
                  onChange={(e) => handleChange('full_description', e.target.value)}
                  placeholder="Полное описание с историей бренда"
                  rows={5}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="philosophy">Философия</Label>
                <Textarea
                  id="philosophy"
                  value={formData.philosophy}
                  onChange={(e) => handleChange('philosophy', e.target.value)}
                  placeholder="Философия бренда"
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>

          {/* Side Info */}
          <div className="space-y-6">
            {/* Logo Upload */}
            <Card>
              <CardHeader>
                <CardTitle>Логотип</CardTitle>
              </CardHeader>
              <CardContent>
                <ImageUpload
                  value={brand?.logo}
                  onChange={setLogoFile}
                  aspectRatio="square"
                />
              </CardContent>
            </Card>

            {/* Details */}
            <Card>
              <CardHeader>
                <CardTitle>Детали</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="website">Вебсайт</Label>
                  <Input
                    id="website"
                    type="url"
                    value={formData.website}
                    onChange={(e) => handleChange('website', e.target.value)}
                    placeholder="https://example.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="country">Страна</Label>
                  <Input
                    id="country"
                    value={formData.country}
                    onChange={(e) => handleChange('country', e.target.value)}
                    placeholder="Южная Корея"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="founded">Год основания</Label>
                  <Input
                    id="founded"
                    value={formData.founded}
                    onChange={(e) => handleChange('founded', e.target.value)}
                    placeholder="2020"
                  />
                </div>

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

        {/* Highlights */}
        <Card>
          <CardHeader>
            <CardTitle>Особенности бренда</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                value={newHighlight}
                onChange={(e) => setNewHighlight(e.target.value)}
                placeholder="Добавить особенность"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addHighlight();
                  }
                }}
              />
              <Button type="button" variant="secondary" onClick={addHighlight}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            
            {formData.highlights.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.highlights.map((highlight, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-1 bg-muted px-3 py-1 rounded-full text-sm"
                  >
                    <span>{highlight}</span>
                    <button
                      type="button"
                      onClick={() => removeHighlight(index)}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </form>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить бренд?</AlertDialogTitle>
            <AlertDialogDescription>
              Вы уверены, что хотите удалить бренд "{brand?.name}"? Это действие нельзя отменить.
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
