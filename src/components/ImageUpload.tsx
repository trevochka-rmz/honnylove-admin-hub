import { useState, useRef } from 'react';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
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
  const fileInputRef = useRef<HTMLInputElement>(null);

  const displayImage = preview || value;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    onChange(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleRemove = () => {
    setPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onChange(null);
    onRemove?.();
  };

  const aspectClasses = {
    square: 'aspect-square',
    video: 'aspect-video',
    auto: '',
  };

  return (
    <div className={cn('border-2 border-dashed border-border rounded-lg overflow-hidden', className)}>
      {displayImage ? (
        <div className={cn('relative', aspectClasses[aspectRatio])}>
          <img
            src={displayImage.startsWith('/') ? `${import.meta.env.VITE_API_BASE_URL}${displayImage}` : displayImage}
            alt="Preview"
            className="w-full h-full object-contain bg-muted"
          />
          {!disabled && (
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="absolute top-2 right-2 h-8 w-8"
              onClick={handleRemove}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      ) : (
        <div
          className={cn(
            'flex flex-col items-center justify-center py-8 cursor-pointer hover:bg-muted/50 transition-colors',
            aspectClasses[aspectRatio],
            disabled && 'opacity-50 pointer-events-none'
          )}
          onClick={() => !disabled && fileInputRef.current?.click()}
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
  const fileInputRef = useRef<HTMLInputElement>(null);

  const allImages = [...value, ...previews];
  const canAddMore = allImages.length < maxImages;

  const handleAdd = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

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

  const getImageSrc = (item: string, index: number) => {
    if (index < value.length) {
      // Existing image from server
      return item.startsWith('/') ? `${import.meta.env.VITE_API_BASE_URL}${item}` : item;
    }
    // Preview of new file
    return previews[index - value.length];
  };

  return (
    <div className={cn('space-y-3', className)}>
      <div className="grid grid-cols-2 gap-3">
        {allImages.map((img, index) => (
          <div key={index} className="relative aspect-square rounded-lg overflow-hidden border border-border">
            <img
              src={getImageSrc(img, index)}
              alt={`Gallery ${index + 1}`}
              className="w-full h-full object-contain bg-muted"
            />
            {!disabled && (
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2 h-6 w-6"
                onClick={() => handleRemove(index)}
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
        ))}
        
        {canAddMore && !disabled && (
          <div
            className="aspect-square rounded-lg border-2 border-dashed border-border flex flex-col items-center justify-center cursor-pointer hover:bg-muted/50 transition-colors"
            onClick={() => fileInputRef.current?.click()}
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
