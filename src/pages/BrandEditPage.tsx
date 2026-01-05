import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '@/lib/api';
import type { BrandDetail } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ArrowLeft, Save, Image as ImageIcon, Plus, X } from 'lucide-react';

export default function BrandEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const isNew = id === 'new';

  const [isLoading, setIsLoading] = useState(!isNew);
  const [isSaving, setIsSaving] = useState(false);
  const [brand, setBrand] = useState<BrandDetail | null>(null);

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
      if (isNew) {
        await api.createBrand(formData);
        toast({
          title: 'Бренд создан',
          description: 'Бренд успешно создан',
        });
      } else if (id) {
        await api.updateBrand(parseInt(id), formData);
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
            {/* Logo Preview */}
            {!isNew && brand?.logo && (
              <Card>
                <CardHeader>
                  <CardTitle>Логотип</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="aspect-square rounded-lg overflow-hidden bg-muted">
                    <img
                      src={brand.logo}
                      alt={brand.name}
                      className="w-full h-full object-contain p-4"
                    />
                  </div>
                </CardContent>
              </Card>
            )}

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

        {/* Actions */}
        <div className="flex gap-4">
          <Button type="submit" disabled={isSaving}>
            {isSaving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            {isNew ? 'Создать бренд' : 'Сохранить изменения'}
          </Button>
          <Button type="button" variant="outline" onClick={() => navigate('/brands')}>
            Отмена
          </Button>
        </div>
      </form>
    </div>
  );
}
