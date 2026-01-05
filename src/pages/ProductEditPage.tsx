import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import type { Product, Brand, Category } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Save, Loader2, Package } from 'lucide-react';

export default function ProductEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const isNew = id === 'new';

  const [isLoading, setIsLoading] = useState(!isNew);
  const [isSaving, setIsSaving] = useState(false);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    purchasePrice: '',
    price: '',
    discountPrice: '',
    brand_id: '',
    category_id: '',
    sku: '',
    product_type: 'cosmetic',
    target_audience: 'unisex',
    skin_type: '',
    ingredients: '',
    usage: '',
    inStock: true,
    isNew: false,
    isBestseller: false,
    isFeatured: false,
    weight_grams: '',
    meta_title: '',
    meta_description: '',
  });

  const [product, setProduct] = useState<Product | null>(null);

  useEffect(() => {
    Promise.all([api.getBrands(), api.getCategories()]).then(([brandsRes, categoriesRes]) => {
      setBrands(brandsRes.brands);
      setCategories(categoriesRes.data);
    });

    if (!isNew && id) {
      loadProduct(id);
    }
  }, [id, isNew]);

  const loadProduct = async (productId: string) => {
    setIsLoading(true);
    try {
      const data = await api.getProduct(productId);
      setProduct(data);
      setFormData({
        name: data.name || '',
        description: data.description || '',
        purchasePrice: data.purchasePrice || '',
        price: data.price || '',
        discountPrice: data.discountPrice || '',
        brand_id: data.brand_id?.toString() || '',
        category_id: data.category_id?.toString() || '',
        sku: data.sku || '',
        product_type: data.product_type || 'cosmetic',
        target_audience: data.target_audience || 'unisex',
        skin_type: data.skin_type || '',
        ingredients: data.ingredients || '',
        usage: data.usage || '',
        inStock: data.inStock ?? true,
        isNew: data.isNew ?? false,
        isBestseller: data.isBestseller ?? false,
        isFeatured: data.isFeatured ?? false,
        weight_grams: data.weight_grams?.toString() || '',
        meta_title: data.meta_title || '',
        meta_description: data.meta_description || '',
      });
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось загрузить товар',
        variant: 'destructive',
      });
      navigate('/products');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const flattenCategories = (
    cats: Category[],
    level = 0
  ): { id: number; name: string; level: number }[] => {
    let result: { id: number; name: string; level: number }[] = [];
    for (const cat of cats) {
      result.push({ id: cat.id, name: cat.name, level });
      if (cat.children && cat.children.length > 0) {
        result = result.concat(flattenCategories(cat.children, level + 1));
      }
    }
    return result;
  };

  const flatCategories = flattenCategories(categories);

  const handleSave = async () => {
    if (!formData.name) {
      toast({
        title: 'Ошибка',
        description: 'Введите название товара',
        variant: 'destructive',
      });
      return;
    }

    setIsSaving(true);
    try {
      if (isNew) {
        await api.createProduct({
          name: formData.name,
          purchase_price: Number(formData.purchasePrice) || 0,
          retail_price: Number(formData.price) || 0,
          brand_id: Number(formData.brand_id) || 1,
          category_id: Number(formData.category_id) || 1,
          product_type: formData.product_type,
        });
        toast({ title: 'Успешно', description: 'Товар создан' });
      } else if (id) {
        const updates: Record<string, any> = {};
        
        if (formData.name !== product?.name) updates.name = formData.name;
        if (formData.description !== product?.description) updates.description = formData.description;
        if (formData.purchasePrice !== product?.purchasePrice) updates.purchase_price = Number(formData.purchasePrice);
        if (formData.price !== product?.price) updates.retail_price = Number(formData.price);
        if (formData.discountPrice !== product?.discountPrice) updates.discount_price = formData.discountPrice ? Number(formData.discountPrice) : null;
        if (formData.brand_id !== product?.brand_id?.toString()) updates.brand_id = Number(formData.brand_id);
        if (formData.category_id !== product?.category_id?.toString()) updates.category_id = Number(formData.category_id);
        if (formData.sku !== product?.sku) updates.sku = formData.sku;
        if (formData.product_type !== product?.product_type) updates.product_type = formData.product_type;
        if (formData.target_audience !== product?.target_audience) updates.target_audience = formData.target_audience;
        if (formData.skin_type !== product?.skin_type) updates.skin_type = formData.skin_type;
        if (formData.ingredients !== product?.ingredients) updates.ingredients = formData.ingredients;
        if (formData.usage !== product?.usage) updates.usage = formData.usage;
        if (formData.inStock !== product?.inStock) updates.in_stock = formData.inStock;
        if (formData.isNew !== product?.isNew) updates.is_new = formData.isNew;
        if (formData.isBestseller !== product?.isBestseller) updates.is_bestseller = formData.isBestseller;
        if (formData.isFeatured !== product?.isFeatured) updates.is_featured = formData.isFeatured;
        if (formData.weight_grams !== product?.weight_grams?.toString()) updates.weight_grams = formData.weight_grams ? Number(formData.weight_grams) : null;
        if (formData.meta_title !== product?.meta_title) updates.meta_title = formData.meta_title;
        if (formData.meta_description !== product?.meta_description) updates.meta_description = formData.meta_description;

        if (Object.keys(updates).length > 0) {
          await api.updateProduct(id, updates);
        }
        toast({ title: 'Успешно', description: 'Товар обновлен' });
      }
      navigate('/products');
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: error instanceof Error ? error.message : 'Не удалось сохранить',
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
        <Button variant="ghost" size="icon" onClick={() => navigate('/products')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-foreground">
            {isNew ? 'Новый товар' : 'Редактирование товара'}
          </h1>
          {product && (
            <p className="text-muted-foreground">ID: {product.id} • SKU: {product.sku}</p>
          )}
        </div>
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          Сохранить
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
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
                  placeholder="Название товара"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Описание</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  placeholder="Описание товара"
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="brand">Бренд</Label>
                  <Select
                    value={formData.brand_id}
                    onValueChange={(value) => handleChange('brand_id', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Выберите бренд" />
                    </SelectTrigger>
                    <SelectContent>
                      {brands.map((brand) => (
                        <SelectItem key={brand.id} value={brand.id.toString()}>
                          {brand.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Категория</Label>
                  <Select
                    value={formData.category_id}
                    onValueChange={(value) => handleChange('category_id', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Выберите категорию" />
                    </SelectTrigger>
                    <SelectContent className="max-h-64">
                      {flatCategories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id.toString()}>
                          {'—'.repeat(cat.level)} {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="sku">SKU</Label>
                <Input
                  id="sku"
                  value={formData.sku}
                  onChange={(e) => handleChange('sku', e.target.value)}
                  placeholder="Артикул"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Цены</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="purchasePrice">Закупочная цена</Label>
                  <Input
                    id="purchasePrice"
                    type="number"
                    value={formData.purchasePrice}
                    onChange={(e) => handleChange('purchasePrice', e.target.value)}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="price">Розничная цена</Label>
                  <Input
                    id="price"
                    type="number"
                    value={formData.price}
                    onChange={(e) => handleChange('price', e.target.value)}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="discountPrice">Цена со скидкой</Label>
                  <Input
                    id="discountPrice"
                    type="number"
                    value={formData.discountPrice}
                    onChange={(e) => handleChange('discountPrice', e.target.value)}
                    placeholder="Опционально"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Дополнительно</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="product_type">Тип товара</Label>
                  <Select
                    value={formData.product_type}
                    onValueChange={(value) => handleChange('product_type', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cosmetic">Косметика</SelectItem>
                      <SelectItem value="clothing">Одежда</SelectItem>
                      <SelectItem value="accessory">Аксессуар</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="target_audience">Аудитория</Label>
                  <Select
                    value={formData.target_audience}
                    onValueChange={(value) => handleChange('target_audience', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unisex">Унисекс</SelectItem>
                      <SelectItem value="women">Женщины</SelectItem>
                      <SelectItem value="men">Мужчины</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="skin_type">Тип кожи</Label>
                  <Input
                    id="skin_type"
                    value={formData.skin_type}
                    onChange={(e) => handleChange('skin_type', e.target.value)}
                    placeholder="Для любого типа"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="ingredients">Состав</Label>
                <Textarea
                  id="ingredients"
                  value={formData.ingredients}
                  onChange={(e) => handleChange('ingredients', e.target.value)}
                  placeholder="Ингредиенты"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="usage">Применение</Label>
                <Textarea
                  id="usage"
                  value={formData.usage}
                  onChange={(e) => handleChange('usage', e.target.value)}
                  placeholder="Инструкция по применению"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="weight">Вес (грамм)</Label>
                <Input
                  id="weight"
                  type="number"
                  value={formData.weight_grams}
                  onChange={(e) => handleChange('weight_grams', e.target.value)}
                  placeholder="0"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>SEO</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="meta_title">Meta Title</Label>
                <Input
                  id="meta_title"
                  value={formData.meta_title}
                  onChange={(e) => handleChange('meta_title', e.target.value)}
                  placeholder="SEO заголовок"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="meta_description">Meta Description</Label>
                <Textarea
                  id="meta_description"
                  value={formData.meta_description}
                  onChange={(e) => handleChange('meta_description', e.target.value)}
                  placeholder="SEO описание"
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Image Preview */}
          {product?.image && (
            <Card>
              <CardHeader>
                <CardTitle>Изображение</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="aspect-square rounded-lg overflow-hidden bg-muted">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Status Toggles */}
          <Card>
            <CardHeader>
              <CardTitle>Статус</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="inStock">В наличии</Label>
                <Switch
                  id="inStock"
                  checked={formData.inStock}
                  onCheckedChange={(checked) => handleChange('inStock', checked)}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <Label htmlFor="isNew">Новинка</Label>
                <Switch
                  id="isNew"
                  checked={formData.isNew}
                  onCheckedChange={(checked) => handleChange('isNew', checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="isBestseller">Бестселлер</Label>
                <Switch
                  id="isBestseller"
                  checked={formData.isBestseller}
                  onCheckedChange={(checked) => handleChange('isBestseller', checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="isFeatured">Рекомендуемый</Label>
                <Switch
                  id="isFeatured"
                  checked={formData.isFeatured}
                  onCheckedChange={(checked) => handleChange('isFeatured', checked)}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
