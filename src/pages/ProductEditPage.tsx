import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import type { Product, Category, StockVariant } from '@/types';
import ProductVariantsManager from '@/components/product/ProductVariantsManager';
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
import { ArrowLeft, Save, Loader2, Trash2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ImageUpload, GalleryUpload } from '@/components/ImageUpload';

function CategorySelector({ 
  categories, 
  value, 
  onChange,
  disabled 
}: { 
  categories: Category[]; 
  value: string; 
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  const [openCategories, setOpenCategories] = useState<Set<number>>(new Set());

  const toggleCategory = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const newOpen = new Set(openCategories);
    if (newOpen.has(id)) {
      newOpen.delete(id);
    } else {
      newOpen.add(id);
    }
    setOpenCategories(newOpen);
  };

  const renderCategory = (cat: Category, level = 0) => {
    const hasChildren = cat.children && cat.children.length > 0;
    const isOpen = openCategories.has(cat.id);
    const isSelected = value === cat.id.toString();

    return (
      <div key={cat.id}>
        <div
          className={cn(
            'flex items-center gap-2 py-1.5 px-2 rounded cursor-pointer hover:bg-muted/50',
            isSelected && 'bg-primary/10 text-primary',
            disabled && 'opacity-50 pointer-events-none'
          )}
          style={{ paddingLeft: `${level * 16 + 8}px` }}
          onClick={() => onChange(cat.id.toString())}
        >
          {hasChildren && (
            <button
              onClick={(e) => toggleCategory(cat.id, e)}
              className="p-0.5 hover:bg-muted rounded"
            >
              {isOpen ? (
                <ChevronDown className="h-3 w-3" />
              ) : (
                <ChevronRight className="h-3 w-3" />
              )}
            </button>
          )}
          {!hasChildren && <span className="w-4" />}
          <span className="text-sm">{cat.name}</span>
        </div>
        {hasChildren && isOpen && (
          <div>
            {cat.children!.map((child) => renderCategory(child as Category, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="border rounded-md max-h-64 overflow-y-auto">
      {categories.map((cat) => renderCategory(cat))}
    </div>
  );
}

export default function ProductEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAdmin } = useAuth();
  const isNew = id === 'new';

  const [isLoading, setIsLoading] = useState(!isNew);
  const [isSaving, setIsSaving] = useState(false);
  const [brands, setBrands] = useState<{ id: number; name: string; logo: string }[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  // Image state
  const [mainImage, setMainImage] = useState<File | null>(null);
  const [galleryFiles, setGalleryFiles] = useState<(File | string)[]>([]);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    purchasePrice: '',
    purchasePriceKg: '',
    price: '',
    discountPrice: '',
    priceKg: '',
    discountPriceKg: '',
    brand_id: '',
    category_id: '',
    sku: '',
    product_type: 'cosmetic',
    target_audience: 'unisex',
    skin_type: '',
    ingredients: '',
    usage: '',
    isNew: false,
    isBestseller: false,
    isFeatured: false,
    meta_title: '',
    meta_description: '',
    stockQuantity: '',
  });

  const [stockVariants, setStockVariants] = useState<StockVariant[]>([]);

  const [product, setProduct] = useState<Product | null>(null);

  useEffect(() => {
    Promise.all([api.getBrandsBrief(), api.getCategories()]).then(([brandsRes, categoriesRes]) => {
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
        priceKg: data.priceKg || '',
        discountPriceKg: data.discountPriceKg || '',
        brand_id: data.brand_id?.toString() || '',
        category_id: data.category_id?.toString() || '',
        sku: data.sku || '',
        product_type: data.product_type || 'cosmetic',
        target_audience: data.target_audience || 'unisex',
        skin_type: data.skin_type || '',
        ingredients: data.ingredients || '',
        usage: data.usage || '',
        variant_name: '',
        variant_value: '',
        isNew: data.isNew ?? false,
        isBestseller: data.isBestseller ?? false,
        isFeatured: data.isFeatured ?? false,
        meta_title: data.meta_title || '',
        meta_description: data.meta_description || '',
        stockQuantity: data.stockQuantityTotal?.toString() || '',
      });
      setStockVariants(data.stockVariants || []);
      // Set existing gallery images
      if (data.images && data.images.length > 0) {
        setGalleryFiles(data.images);
      }
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

  const getCategoryName = (catId: string) => {
    const findCat = (cats: Category[]): string | null => {
      for (const cat of cats) {
        if (cat.id.toString() === catId) return cat.name;
        if (cat.children) {
          const found = findCat(cat.children);
          if (found) return found;
        }
      }
      return null;
    };
    return findCat(categories) || 'Выберите категорию';
  };

  // Store original data for comparison (to detect changes)
  const [originalData, setOriginalData] = useState<typeof formData | null>(null);

  useEffect(() => {
    if (product && !originalData) {
      setOriginalData({ ...formData });
    }
  }, [product, formData, originalData]);

  const handleSave = async () => {
    if (!isAdmin) {
      toast({
        title: 'Ошибка',
        description: 'У вас нет прав для редактирования',
        variant: 'destructive',
      });
      return;
    }

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
        // For new products, send all fields via FormData
        const fd = new FormData();
        fd.append('name', formData.name);
        fd.append('retail_price', formData.price || '0');
        fd.append('purchase_price', formData.purchasePrice || '0');
        fd.append('brand_id', formData.brand_id || '1');
        fd.append('category_id', formData.category_id || '1');
        fd.append('product_type', formData.product_type);
        if (formData.description) fd.append('description', formData.description);
        if (formData.discountPrice) fd.append('discount_price', formData.discountPrice);
        if (formData.target_audience) fd.append('target_audience', formData.target_audience);
        if (formData.skin_type) fd.append('skin_type', formData.skin_type);
        if (formData.stockQuantity) fd.append('stockQuantity', formData.stockQuantity);
        if (formData.meta_title) fd.append('meta_title', formData.meta_title);
        if (formData.meta_description) fd.append('meta_description', formData.meta_description);
        fd.append('is_active', 'true');
        fd.append('is_new', formData.isNew ? 'true' : 'false');
        fd.append('is_bestseller', formData.isBestseller ? 'true' : 'false');
        fd.append('is_featured', formData.isFeatured ? 'true' : 'false');
        
        // Build attributes as JSON string
        const attributes: Record<string, any> = {};
        if (formData.ingredients) attributes.ingredients = formData.ingredients;
        if (formData.usage) attributes.usage = formData.usage;
        attributes.variants = [{ 
          name: formData.variant_name || 'Объём', 
          value: formData.variant_value || '50мл' 
        }];
        fd.append('attributes', JSON.stringify(attributes));
        
        // Images
        if (mainImage) fd.append('mainImage', mainImage);
        const galleryFilesOnly = galleryFiles.filter((f): f is File => f instanceof File);
        galleryFilesOnly.forEach((file) => fd.append('gallery', file));
        
        await api.createProductWithImages(fd);
        toast({ title: 'Успешно', description: 'Товар создан' });
      } else if (id) {
        // Update existing product - only send changed fields
        
        // Build the update payload with only changed fields
        const updatePayload: Record<string, any> = {};
        
        // Compare each field with original and only add if changed
        if (formData.name !== originalData?.name) {
          updatePayload.name = formData.name;
        }
        if (formData.description !== originalData?.description) {
          updatePayload.description = formData.description;
        }
        if (formData.purchasePrice !== originalData?.purchasePrice) {
          updatePayload.purchase_price = formData.purchasePrice || '0';
        }
        if (formData.price !== originalData?.price) {
          updatePayload.retail_price = formData.price || '0';
        }
        if (formData.discountPrice !== originalData?.discountPrice) {
          updatePayload.discount_price = formData.discountPrice || '';
        }
        if (formData.priceKg !== originalData?.priceKg) {
          updatePayload.price_kg = formData.priceKg || '';
        }
        if (formData.discountPriceKg !== originalData?.discountPriceKg) {
          updatePayload.discount_price_kg = formData.discountPriceKg || '';
        }
        if (formData.brand_id !== originalData?.brand_id) {
          updatePayload.brand_id = formData.brand_id;
        }
        if (formData.category_id !== originalData?.category_id) {
          updatePayload.category_id = formData.category_id;
        }
        if (formData.product_type !== originalData?.product_type) {
          updatePayload.product_type = formData.product_type;
        }
        if (formData.target_audience !== originalData?.target_audience) {
          updatePayload.target_audience = formData.target_audience;
        }
        if (formData.skin_type !== originalData?.skin_type) {
          updatePayload.skin_type = formData.skin_type;
        }
        if (formData.stockQuantity !== originalData?.stockQuantity) {
          updatePayload.stockQuantity = formData.stockQuantity;
        }
        if (formData.meta_title !== originalData?.meta_title) {
          updatePayload.meta_title = formData.meta_title;
        }
        if (formData.meta_description !== originalData?.meta_description) {
          updatePayload.meta_description = formData.meta_description;
        }
        if (formData.isNew !== originalData?.isNew) {
          updatePayload.is_new = formData.isNew;
        }
        if (formData.isBestseller !== originalData?.isBestseller) {
          updatePayload.is_bestseller = formData.isBestseller;
        }
        if (formData.isFeatured !== originalData?.isFeatured) {
          updatePayload.is_featured = formData.isFeatured;
        }

        // Check attributes for changes - only send if any attribute changed
        const attributesChanged = 
          formData.ingredients !== originalData?.ingredients ||
          formData.usage !== originalData?.usage ||
          formData.variant_name !== originalData?.variant_name ||
          formData.variant_value !== originalData?.variant_value;

        if (attributesChanged) {
          const attributes: Record<string, any> = {};
          if (formData.ingredients !== originalData?.ingredients) {
            attributes.ingredients = formData.ingredients;
          }
          if (formData.usage !== originalData?.usage) {
            attributes.usage = formData.usage;
          }
          if (formData.variant_name !== originalData?.variant_name || formData.variant_value !== originalData?.variant_value) {
            attributes.variants = formData.variant_name || formData.variant_value
              ? [{ name: formData.variant_name || 'Объём', value: formData.variant_value || '' }]
              : [];
          }
          updatePayload.attributes = attributes;
        }

        const hasNewImages = mainImage || galleryFiles.some((f) => f instanceof File);
        const hasFieldChanges = Object.keys(updatePayload).length > 0;

        if (!hasFieldChanges && !hasNewImages) {
          toast({ title: 'Информация', description: 'Нет изменений для сохранения' });
        } else {
          // Always use FormData (backend requires multipart/form-data)
          const fd = new FormData();
          
          for (const [key, value] of Object.entries(updatePayload)) {
            if (key === 'attributes') {
              fd.append('attributes', JSON.stringify(value));
            } else if (typeof value === 'boolean') {
              fd.append(key, value.toString());
            } else {
              fd.append(key, String(value));
            }
          }
          
          if (mainImage) {
            fd.append('mainImage', mainImage);
          }
          const galleryFilesOnly = galleryFiles.filter((f): f is File => f instanceof File);
          if (galleryFilesOnly.length > 0) {
            galleryFilesOnly.forEach((file) => fd.append('gallery', file));
          }
          
          await api.updateProductWithImages(id, fd);
          toast({ title: 'Успешно', description: 'Товар обновлен' });
        }
      }
      navigate(-1);
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

  const handleDelete = async () => {
    if (!id || isNew) return;
    try {
      await api.deleteProduct(id);
      toast({ title: 'Удалено', description: 'Товар удалён' });
      navigate(-1);
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: error instanceof Error ? error.message : 'Не удалось удалить',
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const canEdit = isAdmin;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-foreground">
            {isNew ? 'Новый товар' : canEdit ? 'Редактирование товара' : 'Просмотр товара'}
          </h1>
          {product && (
            <p className="text-muted-foreground">ID: {product.id} • SKU: {product.sku}</p>
          )}
        </div>
        {canEdit && (
          <div className="flex items-center gap-2">
            {!isNew && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    <Trash2 className="h-4 w-4" />
                    Удалить
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Удалить товар?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Это действие нельзя отменить. Товар будет удалён.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Отмена</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete}>Удалить</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Сохранить
            </Button>
          </div>
        )}
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
                  disabled={!canEdit}
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
                  disabled={!canEdit}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="brand">Бренд</Label>
                  <Select
                    value={formData.brand_id}
                    onValueChange={(value) => handleChange('brand_id', value)}
                    disabled={!canEdit}
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
                  <Label>Категория</Label>
                  <div className="text-sm text-muted-foreground mb-2">
                    Выбрано: {getCategoryName(formData.category_id)}
                  </div>
                  <CategorySelector
                    categories={categories}
                    value={formData.category_id}
                    onChange={(value) => handleChange('category_id', value)}
                    disabled={!canEdit}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Цены и наличие</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {isAdmin && (
                  <div className="space-y-2">
                    <Label htmlFor="purchasePrice">Закупочная цена</Label>
                    <Input
                      id="purchasePrice"
                      type="number"
                      value={formData.purchasePrice}
                      onChange={(e) => handleChange('purchasePrice', e.target.value)}
                      placeholder="0"
                      disabled={!canEdit}
                    />
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="price">Розничная цена ₽</Label>
                  <Input
                    id="price"
                    type="number"
                    value={formData.price}
                    onChange={(e) => handleChange('price', e.target.value)}
                    placeholder="0"
                    disabled={!canEdit}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="discountPrice">Скидка ₽</Label>
                  <Input
                    id="discountPrice"
                    type="number"
                    value={formData.discountPrice}
                    onChange={(e) => handleChange('discountPrice', e.target.value)}
                    placeholder="Опционально"
                    disabled={!canEdit}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="stockQuantity">Количество</Label>
                  <Input
                    id="stockQuantity"
                    type="number"
                    value={formData.stockQuantity}
                    onChange={(e) => handleChange('stockQuantity', e.target.value)}
                    placeholder="0"
                    disabled={!canEdit}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="priceKg">Цена KG (сом)</Label>
                  <Input
                    id="priceKg"
                    type="number"
                    value={formData.priceKg}
                    onChange={(e) => handleChange('priceKg', e.target.value)}
                    placeholder="Кыргызская цена"
                    disabled={!canEdit}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="discountPriceKg">Скидка KG (сом)</Label>
                  <Input
                    id="discountPriceKg"
                    type="number"
                    value={formData.discountPriceKg}
                    onChange={(e) => handleChange('discountPriceKg', e.target.value)}
                    placeholder="Опционально"
                    disabled={!canEdit}
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
                    disabled={!canEdit}
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
                    disabled={!canEdit}
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
                    disabled={!canEdit}
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
                  disabled={!canEdit}
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
                  disabled={!canEdit}
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
                  disabled={!canEdit}
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
                  disabled={!canEdit}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Main Image Upload */}
          <Card>
            <CardHeader>
              <CardTitle>Главное изображение</CardTitle>
            </CardHeader>
            <CardContent>
              <ImageUpload
                value={product?.image}
                onChange={setMainImage}
                disabled={!canEdit}
                aspectRatio="square"
              />
            </CardContent>
          </Card>

          {/* Gallery */}
          <Card>
            <CardHeader>
              <CardTitle>Галерея</CardTitle>
            </CardHeader>
            <CardContent>
              <GalleryUpload
                value={galleryFiles.filter((f): f is string => typeof f === 'string')}
                onChange={setGalleryFiles}
                maxImages={2}
                disabled={!canEdit}
              />
            </CardContent>
          </Card>

          {/* Status Toggles */}
          <Card>
            <CardHeader>
              <CardTitle>Статус</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-foreground">Наличие</span>
                <span className="text-sm text-muted-foreground">
                  {(Number(formData.stockQuantity) || 0) > 0 ? 'В наличии' : 'Нет'}
                </span>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <Label htmlFor="isNew">Новинка</Label>
                <Switch
                  id="isNew"
                  checked={formData.isNew}
                  onCheckedChange={(checked) => handleChange('isNew', checked)}
                  disabled={!canEdit}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="isBestseller">Бестселлер</Label>
                <Switch
                  id="isBestseller"
                  checked={formData.isBestseller}
                  onCheckedChange={(checked) => handleChange('isBestseller', checked)}
                  disabled={!canEdit}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="isFeatured">Рекомендуемый</Label>
                <Switch
                  id="isFeatured"
                  checked={formData.isFeatured}
                  onCheckedChange={(checked) => handleChange('isFeatured', checked)}
                  disabled={!canEdit}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Variants Section - full width below */}
      {!isNew && id && (
        <ProductVariantsManager
          productId={id}
          variants={stockVariants}
          onVariantsChange={setStockVariants}
          canEdit={canEdit}
          productImage={product?.image || null}
        />
      )}
    </div>
  );
}
