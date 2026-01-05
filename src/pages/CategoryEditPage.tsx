import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '@/lib/api';
import type { CategoryDetail, Category } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ArrowLeft, Save, Image as ImageIcon } from 'lucide-react';

export default function CategoryEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const isNew = id === 'new';

  const [isLoading, setIsLoading] = useState(!isNew);
  const [isSaving, setIsSaving] = useState(false);
  const [category, setCategory] = useState<CategoryDetail | null>(null);
  const [allCategories, setAllCategories] = useState<Category[]>([]);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    parent_id: null as number | null,
    display_order: 1,
    is_active: true,
  });

  useEffect(() => {
    loadAllCategories();
    if (!isNew && id) {
      loadCategory(parseInt(id));
    }
  }, [id, isNew]);

  const loadAllCategories = async () => {
    try {
      const response = await api.getCategories();
      setAllCategories(response.data);
    } catch (error) {
      console.error('Failed to load categories');
    }
  };

  const loadCategory = async (categoryId: number) => {
    setIsLoading(true);
    try {
      const response = await api.getCategory(categoryId);
      const data = response.data;
      setCategory(data);
      setFormData({
        name: data.name || '',
        description: data.description || '',
        parent_id: data.parent_id,
        display_order: data.display_order || 1,
        is_active: data.is_active ?? true,
      });
    } catch (error) {
      toast({
        title: 'Ошибка загрузки',
        description: 'Не удалось загрузить категорию',
        variant: 'destructive',
      });
      navigate('/categories');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (field: string, value: string | boolean | number | null) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Flatten categories for parent selection (only levels 1 and 2)
  const flattenCategories = (categories: Category[], level = 1): { id: number; name: string; level: number }[] => {
    const result: { id: number; name: string; level: number }[] = [];
    
    for (const cat of categories) {
      // Don't allow selecting self or deeper than level 2 as parent
      if (level <= 2 && (!id || cat.id !== parseInt(id))) {
        const prefix = level === 2 ? '— ' : '';
        result.push({ id: cat.id, name: prefix + cat.name, level });
        
        if (cat.children && level < 2) {
          result.push(...flattenCategories(cat.children, level + 1));
        }
      }
    }
    
    return result;
  };

  const parentOptions = flattenCategories(allCategories);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast({
        title: 'Ошибка',
        description: 'Название категории обязательно',
        variant: 'destructive',
      });
      return;
    }

    setIsSaving(true);
    try {
      if (isNew) {
        const createData: { name: string; parent_id?: number; description?: string; is_active?: boolean } = {
          name: formData.name,
        };
        if (formData.parent_id) createData.parent_id = formData.parent_id;
        if (formData.description) createData.description = formData.description;
        createData.is_active = formData.is_active;
        
        await api.createCategory(createData);
        toast({
          title: 'Категория создана',
          description: 'Категория успешно создана',
        });
      } else if (id) {
        await api.updateCategory(parseInt(id), {
          name: formData.name,
          description: formData.description || undefined,
          parent_id: formData.parent_id,
          display_order: formData.display_order,
          is_active: formData.is_active,
        });
        toast({
          title: 'Категория обновлена',
          description: 'Изменения сохранены',
        });
      }
      navigate('/categories');
    } catch (error) {
      toast({
        title: 'Ошибка сохранения',
        description: error instanceof Error ? error.message : 'Не удалось сохранить категорию',
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
        <Button variant="ghost" size="icon" onClick={() => navigate('/categories')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {isNew ? 'Новая категория' : `Редактирование: ${category?.name}`}
          </h1>
          {!isNew && category && (
            <p className="text-muted-foreground">/{category.slug} • Уровень {category.level}</p>
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
                  placeholder="Название категории"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Описание</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  placeholder="Описание категории"
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="parent_id">Родительская категория</Label>
                <Select
                  value={formData.parent_id?.toString() || 'none'}
                  onValueChange={(value) => handleChange('parent_id', value === 'none' ? null : parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите родительскую категорию" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Без родителя (корневая)</SelectItem>
                    {parentOptions.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id.toString()}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="display_order">Порядок отображения</Label>
                <Input
                  id="display_order"
                  type="number"
                  min={1}
                  value={formData.display_order}
                  onChange={(e) => handleChange('display_order', parseInt(e.target.value) || 1)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Side Info */}
          <div className="space-y-6">
            {/* Image Preview */}
            {!isNew && category?.image_url && (
              <Card>
                <CardHeader>
                  <CardTitle>Изображение</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="aspect-square rounded-lg overflow-hidden bg-muted">
                    <img
                      src={category.image_url}
                      alt={category.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Status */}
            <Card>
              <CardHeader>
                <CardTitle>Статус</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="is_active">Активна</Label>
                  <Switch
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => handleChange('is_active', checked)}
                  />
                </div>

                {!isNew && category && (
                  <div className="pt-4 border-t space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Товаров:</span>
                      <span className="font-medium">{category.product_count}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Подкатегорий:</span>
                      <span className="font-medium">{category.children?.length || 0}</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Children */}
            {!isNew && category?.children && category.children.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Подкатегории</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {category.children.map((child) => (
                      <div
                        key={child.id}
                        className="flex items-center gap-2 p-2 rounded-lg bg-muted/50 cursor-pointer hover:bg-muted transition-colors"
                        onClick={() => navigate(`/categories/${child.id}`)}
                      >
                        <div className="w-8 h-8 rounded overflow-hidden bg-muted flex-shrink-0">
                          {child.image_url ? (
                            <img
                              src={child.image_url}
                              alt={child.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                              <ImageIcon className="h-3 w-3" />
                            </div>
                          )}
                        </div>
                        <span className="text-sm truncate">{child.name}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-4">
          <Button type="submit" disabled={isSaving}>
            {isSaving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            {isNew ? 'Создать категорию' : 'Сохранить изменения'}
          </Button>
          <Button type="button" variant="outline" onClick={() => navigate('/categories')}>
            Отмена
          </Button>
        </div>
      </form>
    </div>
  );
}
