import { useState } from 'react';
import { api } from '@/lib/api';
import type { StockVariant } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Plus, Pencil, Trash2, Loader2, Package, ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  productId: string;
  variants: StockVariant[];
  onVariantsChange: (variants: StockVariant[]) => void;
  canEdit: boolean;
  productImage?: string | null;
}

interface VariantFormData {
  name: string;
  options: Record<string, string>;
  optionKeys: string[];
  optionValues: string[];
  priceOverride: string;
  discountOverride: string;
  priceOverrideKg: string;
  discountOverrideKg: string;
  stockQuantity: string;
  isAvailable: boolean;
  sortOrder: string;
}

const emptyForm: VariantFormData = {
  name: '',
  options: {},
  optionKeys: [''],
  optionValues: [''],
  priceOverride: '',
  discountOverride: '',
  priceOverrideKg: '',
  discountOverrideKg: '',
  stockQuantity: '0',
  isAvailable: true,
  sortOrder: '0',
};

export default function ProductVariantsManager({ productId, variants, onVariantsChange, canEdit }: Props) {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingVariant, setEditingVariant] = useState<StockVariant | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState<VariantFormData>(emptyForm);
  const [mainImage, setMainImage] = useState<File | null>(null);
  const [galleryFiles, setGalleryFiles] = useState<File[]>([]);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const openCreate = () => {
    setEditingVariant(null);
    setForm(emptyForm);
    setMainImage(null);
    setGalleryFiles([]);
    setImagePreview(null);
    setIsDialogOpen(true);
  };

  const openEdit = (v: StockVariant) => {
    const keys = Object.keys(v.options);
    const vals = Object.values(v.options);
    setEditingVariant(v);
    setForm({
      name: v.name,
      options: v.options,
      optionKeys: keys.length > 0 ? keys : [''],
      optionValues: vals.length > 0 ? vals : [''],
      priceOverride: v.price?.toString() || '',
      discountOverride: v.discountPrice?.toString() || '',
      priceOverrideKg: v.priceKg?.toString() || '',
      discountOverrideKg: v.discountPriceKg?.toString() || '',
      stockQuantity: v.stockQuantity?.toString() || '0',
      isAvailable: v.isAvailable ?? true,
      sortOrder: v.sortOrder?.toString() || '0',
    });
    setMainImage(null);
    setGalleryFiles([]);
    setImagePreview(v.image || null);
    setIsDialogOpen(true);
  };

  const handleOptionChange = (index: number, type: 'key' | 'value', val: string) => {
    setForm(prev => {
      const keys = [...prev.optionKeys];
      const values = [...prev.optionValues];
      if (type === 'key') keys[index] = val;
      else values[index] = val;
      return { ...prev, optionKeys: keys, optionValues: values };
    });
  };

  const addOption = () => {
    setForm(prev => ({
      ...prev,
      optionKeys: [...prev.optionKeys, ''],
      optionValues: [...prev.optionValues, ''],
    }));
  };

  const removeOption = (index: number) => {
    setForm(prev => ({
      ...prev,
      optionKeys: prev.optionKeys.filter((_, i) => i !== index),
      optionValues: prev.optionValues.filter((_, i) => i !== index),
    }));
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast({ title: 'Ошибка', description: 'Укажите название варианта', variant: 'destructive' });
      return;
    }

    setIsSaving(true);
    try {
      const fd = new FormData();
      fd.append('name', form.name);

      // Build options object
      const options: Record<string, string> = {};
      form.optionKeys.forEach((key, i) => {
        if (key.trim() && form.optionValues[i]?.trim()) {
          options[key.trim()] = form.optionValues[i].trim();
        }
      });
      fd.append('options', JSON.stringify(options));

      if (form.priceOverride) fd.append('priceOverride', form.priceOverride);
      if (form.discountOverride) fd.append('discountOverride', form.discountOverride);
      if (form.priceOverrideKg) fd.append('priceOverrideKg', form.priceOverrideKg);
      if (form.discountOverrideKg) fd.append('discountOverrideKg', form.discountOverrideKg);
      if (form.stockQuantity) fd.append('stockQuantity', form.stockQuantity);
      fd.append('isAvailable', form.isAvailable ? 'true' : 'false');
      fd.append('sortOrder', form.sortOrder || '0');

      if (mainImage) fd.append('variantMainImage', mainImage);
      galleryFiles.forEach(file => fd.append('variantGallery', file));

      if (editingVariant) {
        await api.updateProductVariant(productId, editingVariant.id, fd);
        toast({ title: 'Успешно', description: 'Вариант обновлён' });
      } else {
        await api.createProductVariant(productId, fd);
        toast({ title: 'Успешно', description: 'Вариант создан' });
      }

      // Reload variants
      const updated = await api.getProductVariants(productId);
      onVariantsChange(updated);
      setIsDialogOpen(false);
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: error instanceof Error ? error.message : 'Не удалось сохранить вариант',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (variantId: number) => {
    try {
      await api.deleteProductVariant(productId, variantId);
      toast({ title: 'Удалено', description: 'Вариант деактивирован' });
      const updated = await api.getProductVariants(productId);
      onVariantsChange(updated);
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: error instanceof Error ? error.message : 'Не удалось удалить',
        variant: 'destructive',
      });
    }
  };

  const totalStock = variants.reduce((sum, v) => sum + (v.stockQuantity || 0), 0);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Варианты товара</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            {variants.length} вариантов • Общий остаток: {totalStock}
          </p>
        </div>
        {canEdit && (
          <Button size="sm" onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Добавить
          </Button>
        )}
      </CardHeader>
      <CardContent className="p-0">
        {variants.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <Package className="h-10 w-10 mb-3 opacity-50" />
            <p className="text-sm">Нет вариантов</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="w-12">Фото</TableHead>
                  <TableHead>Название</TableHead>
                  <TableHead>Опции</TableHead>
                  <TableHead className="text-right">Цена ₽</TableHead>
                  <TableHead className="text-right">Цена KG</TableHead>
                  <TableHead className="text-center">Остаток</TableHead>
                  <TableHead className="text-center">Статус</TableHead>
                  {canEdit && <TableHead className="w-20" />}
                </TableRow>
              </TableHeader>
              <TableBody>
                {variants.map((v) => (
                  <TableRow key={v.id} className="group">
                    <TableCell>
                      <div className="w-10 h-10 rounded overflow-hidden bg-muted">
                        {v.image ? (
                          <img src={v.image} alt={v.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <ImageIcon className="h-4 w-4 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="font-medium text-sm">{v.name}</p>
                      {v.sku && <p className="text-xs text-muted-foreground">{v.sku}</p>}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {Object.entries(v.options).map(([key, val]) => (
                          <Badge key={key} variant="secondary" className="text-xs">
                            {key}: {val}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="font-medium">{v.price?.toLocaleString('ru-RU')} ₽</span>
                      {v.discountPrice && (
                        <p className="text-xs text-destructive">{v.discountPrice.toLocaleString('ru-RU')} ₽</p>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {v.priceKg ? (
                        <>
                          <span className="font-medium">{v.priceKg.toLocaleString('ru-RU')} сом</span>
                          {v.discountPriceKg && (
                            <p className="text-xs text-destructive">{v.discountPriceKg.toLocaleString('ru-RU')} сом</p>
                          )}
                        </>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <span className={cn(
                        'font-medium',
                        v.stockQuantity === 0 && 'text-destructive',
                        v.stockQuantity > 0 && v.stockQuantity <= 5 && 'text-warning',
                        v.stockQuantity > 5 && 'text-success',
                      )}>
                        {v.stockQuantity}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      {v.inStock ? (
                        <Badge variant="outline" className="text-success border-success text-xs">В наличии</Badge>
                      ) : (
                        <Badge variant="outline" className="text-destructive border-destructive text-xs">Нет</Badge>
                      )}
                    </TableCell>
                    {canEdit && (
                      <TableCell>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(v)}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Удалить вариант?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Вариант «{v.name}» будет деактивирован.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Отмена</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDelete(v.id)}>Удалить</AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingVariant ? 'Редактировать вариант' : 'Новый вариант'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Название *</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Например: XS / Голубой"
              />
            </div>

            {/* Options */}
            <div className="space-y-2">
              <Label>Опции (размер, цвет и т.д.)</Label>
              {form.optionKeys.map((key, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Input
                    value={key}
                    onChange={(e) => handleOptionChange(i, 'key', e.target.value)}
                    placeholder="Ключ (Размер)"
                    className="flex-1"
                  />
                  <Input
                    value={form.optionValues[i] || ''}
                    onChange={(e) => handleOptionChange(i, 'value', e.target.value)}
                    placeholder="Значение (XS)"
                    className="flex-1"
                  />
                  {form.optionKeys.length > 1 && (
                    <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => removeOption(i)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={addOption}>
                <Plus className="mr-1 h-3 w-3" /> Добавить опцию
              </Button>
            </div>

            {/* Prices */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Цена ₽</Label>
                <Input
                  type="number"
                  value={form.priceOverride}
                  onChange={(e) => setForm(prev => ({ ...prev, priceOverride: e.target.value }))}
                  placeholder="Цена товара"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Скидка ₽</Label>
                <Input
                  type="number"
                  value={form.discountOverride}
                  onChange={(e) => setForm(prev => ({ ...prev, discountOverride: e.target.value }))}
                  placeholder="0"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Цена KG (сом)</Label>
                <Input
                  type="number"
                  value={form.priceOverrideKg}
                  onChange={(e) => setForm(prev => ({ ...prev, priceOverrideKg: e.target.value }))}
                  placeholder="0"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Скидка KG (сом)</Label>
                <Input
                  type="number"
                  value={form.discountOverrideKg}
                  onChange={(e) => setForm(prev => ({ ...prev, discountOverrideKg: e.target.value }))}
                  placeholder="0"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Кол-во на складе</Label>
                <Input
                  type="number"
                  value={form.stockQuantity}
                  onChange={(e) => setForm(prev => ({ ...prev, stockQuantity: e.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Порядок сортировки</Label>
                <Input
                  type="number"
                  value={form.sortOrder}
                  onChange={(e) => setForm(prev => ({ ...prev, sortOrder: e.target.value }))}
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Switch
                checked={form.isAvailable}
                onCheckedChange={(v) => setForm(prev => ({ ...prev, isAvailable: v }))}
              />
              <Label>Доступен для покупки</Label>
            </div>

            {/* Images */}
            <div className="space-y-2">
              <Label>Главное фото варианта</Label>
              {(imagePreview && !mainImage) && (
                <img src={imagePreview} alt="preview" className="w-20 h-20 rounded object-cover" />
              )}
              <Input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) setMainImage(file);
                }}
              />
            </div>

            <div className="space-y-2">
              <Label>Галерея (до 2 фото)</Label>
              <Input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                onChange={(e) => {
                  const files = Array.from(e.target.files || []).slice(0, 2);
                  setGalleryFiles(files);
                }}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Отмена</Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingVariant ? 'Сохранить' : 'Создать'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
