import { useState, useRef } from 'react';
import { Upload, X, Image as ImageIcon, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ImageUploadProps {
  value?: string | null;
  onChange: (file: File | null) => void;
  onRemove?: () => void;
  disabled?: boolean;
  className?: string;
  aspectRatio?: 'square' | 'video' | 'auto';
  label?: string;
  hint?: string;
}

export function ImageUpload({
  value,
  onChange,
  onRemove,
  disabled,
  className,
  aspectRatio = 'square',
  label = 'Нажмите для загрузки изображения',
  hint = 'PNG, JPG, WEBP до 5MB',
}: ImageUploadProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [imageError, setImageError] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const displayImage = preview || value;
  const showImage = displayImage && !imageError;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImageError(false);
    onChange(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleRemove = () => {
    setPreview(null);
    setImageError(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onChange(null);
    onRemove?.();
  };

  const handleImageError = () => {
    setImageError(true);
  };

  const handleUploadClick = () => {
    if (!disabled) {
      fileInputRef.current?.click();
    }
  };

  const getImageSrc = (src: string) => {
    if (src.startsWith('data:')) return src;
    if (src.startsWith('/')) return `${import.meta.env.VITE_API_BASE_URL}${src}`;
    return src;
  };

  const aspectClasses = {
    square: 'aspect-square',
    video: 'aspect-video',
    auto: '',
  };

  return (
    <div className={cn('border-2 border-dashed border-border rounded-lg overflow-hidden', className)}>
      {showImage ? (
        <div className={cn('relative', aspectClasses[aspectRatio])}>
          <img
            src={getImageSrc(displayImage!)}
            alt="Preview"
            className="w-full h-full object-contain bg-muted"
            onError={handleImageError}
          />
          {!disabled && (
            <div className="absolute top-2 right-2 flex gap-1">
              <Button
                type="button"
                variant="secondary"
                size="icon"
                className="h-8 w-8"
                onClick={handleUploadClick}
                title="Заменить изображение"
              >
                <Upload className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      ) : imageError && value ? (
        // Показываем placeholder для изображения с ошибкой загрузки (404)
        <div
          className={cn(
            'flex flex-col items-center justify-center py-8 cursor-pointer hover:bg-muted/50 transition-colors bg-muted/30',
            aspectClasses[aspectRatio],
            disabled && 'opacity-50 pointer-events-none'
          )}
          onClick={handleUploadClick}
        >
          <div className="relative">
            <ImageIcon className="h-10 w-10 text-muted-foreground/50" />
            <AlertCircle className="h-4 w-4 text-amber-500 absolute -top-1 -right-1" />
          </div>
          <p className="text-sm text-muted-foreground mt-2">Изображение недоступно</p>
          <p className="text-xs text-amber-600 mt-1">Нажмите, чтобы загрузить новое</p>
        </div>
      ) : (
        <div
          className={cn(
            'flex flex-col items-center justify-center py-8 cursor-pointer hover:bg-muted/50 transition-colors',
            aspectClasses[aspectRatio],
            disabled && 'opacity-50 pointer-events-none'
          )}
          onClick={handleUploadClick}
        >
          <Upload className="h-10 w-10 text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="text-xs text-muted-foreground mt-1">{hint}</p>
        </div>
      )}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleChange}
        disabled={disabled}
      />
    </div>
  );
}

interface GalleryUploadProps {
  value: string[];
  onChange: (files: (File | string)[]) => void;
  maxImages?: number;
  disabled?: boolean;
  className?: string;
}

export function GalleryUpload({
  value = [],
  onChange,
  maxImages = 2,
  disabled,
  className,
}: GalleryUploadProps) {
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [errorImages, setErrorImages] = useState<Set<number>>(new Set());
  const fileInputRef = useRef<HTMLInputElement>(null);
  const replaceIndexRef = useRef<number | null>(null);

  const allImages = [...value, ...previews];
  const canAddMore = allImages.length < maxImages;

  const handleAdd = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    // Если это замена конкретного изображения
    if (replaceIndexRef.current !== null && files.length === 1) {
      const replaceIndex = replaceIndexRef.current;
      replaceIndexRef.current = null;

      const file = files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        if (replaceIndex < value.length) {
          // Заменяем существующее изображение
          const newValue = [...value];
          newValue.splice(replaceIndex, 1);
          setNewFiles((prev) => [...prev, file]);
          setPreviews((prev) => [...prev, reader.result as string]);
          onChange([...newValue, ...newFiles, file]);
          // Убираем ошибку для этого индекса
          setErrorImages((prev) => {
            const next = new Set(prev);
            next.delete(replaceIndex);
            return next;
          });
        }
      };
      reader.readAsDataURL(file);

      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    const remainingSlots = maxImages - allImages.length;
    const filesToAdd = files.slice(0, remainingSlots);

    const newPreviews: string[] = [];
    filesToAdd.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        newPreviews.push(reader.result as string);
        if (newPreviews.length === filesToAdd.length) {
          setPreviews((prev) => [...prev, ...newPreviews]);
          setNewFiles((prev) => [...prev, ...filesToAdd]);
          onChange([...value, ...newFiles, ...filesToAdd]);
        }
      };
      reader.readAsDataURL(file);
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemove = (index: number) => {
    // Убираем ошибку для этого индекса
    setErrorImages((prev) => {
      const next = new Set(prev);
      next.delete(index);
      return next;
    });

    if (index < value.length) {
      // Remove existing image
      const newValue = value.filter((_, i) => i !== index);
      onChange([...newValue, ...newFiles]);
    } else {
      // Remove new file
      const newIndex = index - value.length;
      const updatedFiles = newFiles.filter((_, i) => i !== newIndex);
      const updatedPreviews = previews.filter((_, i) => i !== newIndex);
      setNewFiles(updatedFiles);
      setPreviews(updatedPreviews);
      onChange([...value, ...updatedFiles]);
    }
  };

  const handleImageError = (index: number) => {
    setErrorImages((prev) => new Set(prev).add(index));
  };

  const handleReplaceClick = (index: number) => {
    replaceIndexRef.current = index;
    fileInputRef.current?.click();
  };

  const getImageSrc = (item: string, index: number) => {
    if (index < value.length) {
      // Existing image from server
      if (item.startsWith('data:')) return item;
      if (item.startsWith('/')) return `${import.meta.env.VITE_API_BASE_URL}${item}`;
      return item;
    }
    // Preview of new file
    return previews[index - value.length];
  };

  return (
    <div className={cn('space-y-3', className)}>
      <div className="grid grid-cols-2 gap-3">
        {allImages.map((img, index) => {
          const hasError = errorImages.has(index) && index < value.length;

          return (
            <div key={index} className="relative aspect-square rounded-lg overflow-hidden border border-border">
              {hasError ? (
                <div
                  className="w-full h-full flex flex-col items-center justify-center bg-muted/30 cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => handleReplaceClick(index)}
                >
                  <div className="relative">
                    <ImageIcon className="h-8 w-8 text-muted-foreground/50" />
                    <AlertCircle className="h-3 w-3 text-amber-500 absolute -top-1 -right-1" />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Недоступно</p>
                  <p className="text-xs text-amber-600">Загрузить</p>
                </div>
              ) : (
                <img
                  src={getImageSrc(img, index)}
                  alt={`Gallery ${index + 1}`}
                  className="w-full h-full object-contain bg-muted"
                  onError={() => handleImageError(index)}
                />
              )}
              {!disabled && !hasError && (
                <Button
                  type="button"
                  variant="secondary"
                  size="icon"
                  className="absolute top-2 right-2 h-6 w-6"
                  onClick={() => handleReplaceClick(index)}
                  title="Заменить"
                >
                  <Upload className="h-3 w-3" />
                </Button>
              )}
              {!disabled && hasError && (
                <Button
                  type="button"
                  variant="secondary"
                  size="icon"
                  className="absolute top-2 right-2 h-6 w-6"
                  onClick={() => handleReplaceClick(index)}
                  title="Загрузить"
                >
                  <Upload className="h-3 w-3" />
                </Button>
              )}
            </div>
          );
        })}
        
        {canAddMore && !disabled && (
          <div
            className="aspect-square rounded-lg border-2 border-dashed border-border flex flex-col items-center justify-center cursor-pointer hover:bg-muted/50 transition-colors"
            onClick={() => {
              replaceIndexRef.current = null;
              fileInputRef.current?.click();
            }}
          >
            <ImageIcon className="h-8 w-8 text-muted-foreground mb-1" />
            <p className="text-xs text-muted-foreground">Добавить</p>
          </div>
        )}
      </div>
      
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleAdd}
        disabled={disabled}
      />
      
      <p className="text-xs text-muted-foreground">
        Галерея: {allImages.length} из {maxImages} изображений
      </p>
    </div>
  );
}
