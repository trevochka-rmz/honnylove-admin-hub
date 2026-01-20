import { useEffect, useMemo, useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import type { BlogPost } from "@/types";
import { useToast } from "@/hooks/use-toast";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
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
} from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { ArrowLeft, Loader2, Save, Trash2, X } from "lucide-react";
import { ImageUpload } from "@/components/ImageUpload";
import { cn } from "@/lib/utils";

const AVAILABLE_TAGS = [
  'Уход за лицом',
  'Красота и макияж',
  'Уход за волосами',
  'Уход за телом',
  'Здоровье и добавки',
  'Домашняя одежда и уют',
  'Советы экспертов',
  'Новинки и обзоры',
];

function TagSelector({
  value,
  onChange,
}: {
  value: string[];
  onChange: (tags: string[]) => void;
}) {
  const toggleTag = (tag: string) => {
    if (value.includes(tag)) {
      onChange(value.filter((t) => t !== tag));
    } else {
      onChange([...value, tag]);
    }
  };

  return (
    <div className="space-y-2">
      <Label>Теги</Label>
      <div className="flex flex-wrap gap-2">
        {AVAILABLE_TAGS.map((tag) => {
          const isSelected = value.includes(tag);
          return (
            <button
              key={tag}
              type="button"
              onClick={() => toggleTag(tag)}
              className={cn(
                "px-3 py-1.5 rounded-full text-sm border transition-colors",
                isSelected
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-muted/50 text-muted-foreground border-border hover:border-primary/50"
              )}
            >
              {tag}
            </button>
          );
        })}
      </div>
      {value.length > 0 && (
        <p className="text-xs text-muted-foreground">
          Выбрано: {value.join(", ")}
        </p>
      )}
    </div>
  );
}

const blogSchema = z.object({
  title: z.string().trim().min(1, "Заголовок обязателен"),
  excerpt: z.string().trim().min(1, "Анонс обязателен"),
  content: z.string().trim().min(1, "Контент обязателен"),
  category: z.string().trim().min(1, "Категория обязательна"),
  author: z.string().trim().min(1, "Автор обязателен"),
  read_time: z.coerce.number().int().min(1, "Минимум 1 минута"),
  tagsText: z.string().optional().default(""),
});

type BlogFormValues = z.infer<typeof blogSchema>;

const markdownComponents = {
  h2: (props: any) => <h2 className="text-xl font-semibold text-foreground mt-6" {...props} />,
  h3: (props: any) => <h3 className="text-lg font-semibold text-foreground mt-5" {...props} />,
  p: (props: any) => <p className="text-sm leading-6 text-foreground" {...props} />,
  ul: (props: any) => <ul className="list-disc pl-6 space-y-1" {...props} />,
  ol: (props: any) => <ol className="list-decimal pl-6 space-y-1" {...props} />,
  li: (props: any) => <li className="text-sm text-foreground" {...props} />,
  a: (props: any) => <a className="text-primary underline underline-offset-4" {...props} />,
  code: (props: any) => <code className="px-1 py-0.5 rounded bg-muted text-sm" {...props} />,
  pre: (props: any) => <pre className="p-3 rounded bg-muted overflow-x-auto" {...props} />,
  blockquote: (props: any) => (
    <blockquote className="border-l-2 border-border pl-4 text-muted-foreground" {...props} />
  ),
};

export default function BlogEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAdmin } = useAuth();

  const isNew = id === "new";
  const canEdit = isAdmin;

  const blogQuery = useQuery({
    queryKey: ["blog", id],
    queryFn: () => api.getBlog(id as string),
    enabled: !!id && !isNew,
    refetchOnWindowFocus: false,
  });

  const defaultValues: BlogFormValues = useMemo(
    () => ({
      title: "",
      excerpt: "",
      content: "",
      category: "",
      author: "",
      read_time: 5,
      tagsText: "",
    }),
    []
  );

  const form = useForm<BlogFormValues>({
    resolver: zodResolver(blogSchema),
    defaultValues,
    mode: "onChange",
  });

  const [isSaving, setIsSaving] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [existingImage, setExistingImage] = useState<string>("");

  useEffect(() => {
    if (!blogQuery.data) return;
    const post = blogQuery.data;
    form.reset({
      title: post.title,
      excerpt: post.excerpt,
      content: post.content,
      category: post.category,
      author: post.author,
      read_time: post.read_time,
      tagsText: (post.tags ?? []).join(", "),
    });
    if (post.image) {
      setExistingImage(post.image);
    }
  }, [blogQuery.data, form]);

  const watched = form.watch();
  const previewPost: BlogPost = useMemo(
    () => ({
      id: id || "",
      title: watched.title,
      excerpt: watched.excerpt,
      content: watched.content,
      image: existingImage,
      category: watched.category,
      author: watched.author,
      date: new Date().toISOString().slice(0, 10),
      read_time: watched.read_time,
      tags: watched.tagsText
        ? watched.tagsText
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean)
        : [],
      created_at: "",
      updated_at: "",
    }),
    [watched, existingImage, id]
  );

  const onSubmit = async (values: BlogFormValues) => {
    if (!canEdit) return;

    if (!existingImage && !imageFile && isNew) {
      toast({
        title: "Ошибка",
        description: "Загрузите изображение",
        variant: "destructive",
      });
      return;
    }

    const tags = values.tagsText
      ? values.tagsText
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean)
      : [];

    setIsSaving(true);
    try {
      const fd = new FormData();
      fd.append('title', values.title);
      fd.append('excerpt', values.excerpt);
      fd.append('content', values.content);
      fd.append('category', values.category);
      fd.append('author', values.author);
      fd.append('read_time', values.read_time.toString());
      
      if (tags.length > 0) {
        fd.append('tags', JSON.stringify(tags));
      }

      if (imageFile) {
        fd.append('image', imageFile);
      }

      if (isNew) {
        await api.createBlog(fd);
        toast({ title: "Успешно", description: "Пост создан" });
      } else {
        await api.updateBlog(id as string, fd);
        toast({ title: "Успешно", description: "Пост обновлён" });
      }
      navigate("/blogs");
    } catch (e) {
      toast({
        title: "Ошибка",
        description: e instanceof Error ? e.message : "Не удалось сохранить",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!id || isNew) return;
    try {
      await api.deleteBlog(id);
      toast({ title: "Удалено", description: "Пост удалён" });
      navigate("/blogs");
    } catch (e) {
      toast({
        title: "Ошибка",
        description: e instanceof Error ? e.message : "Не удалось удалить",
        variant: "destructive",
      });
    }
  };

  if (!isNew && blogQuery.isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isNew && blogQuery.isError) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/blogs")}
            aria-label="Назад"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-foreground">Пост</h1>
            <p className="text-muted-foreground">Не удалось загрузить</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/blogs")}
          aria-label="Назад"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>

        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold text-foreground">
            {isNew ? "Новый пост" : canEdit ? "Редактирование поста" : "Просмотр поста"}
          </h1>
          {!isNew && id && <p className="text-muted-foreground">ID: {id}</p>}
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
                    <AlertDialogTitle>Удалить пост?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Это действие нельзя отменить.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Отмена</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete}>Удалить</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}

            <Button onClick={form.handleSubmit(onSubmit)} disabled={isSaving} className="gap-2">
              {isSaving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Сохранить
            </Button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Tabs defaultValue={canEdit ? "edit" : "preview"}>
            <TabsList>
              {canEdit && <TabsTrigger value="edit">Редактор</TabsTrigger>}
              <TabsTrigger value="preview">Предпросмотр</TabsTrigger>
            </TabsList>

            {canEdit && (
              <TabsContent value="edit" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Данные поста</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="title">Заголовок *</Label>
                      <Input id="title" {...form.register("title")} placeholder="Заголовок" />
                      {form.formState.errors.title && (
                        <p className="text-sm text-destructive">{form.formState.errors.title.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="excerpt">Анонс *</Label>
                      <Textarea id="excerpt" rows={3} {...form.register("excerpt")} />
                      {form.formState.errors.excerpt && (
                        <p className="text-sm text-destructive">{form.formState.errors.excerpt.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="content">Контент (Markdown) *</Label>
                      <Textarea id="content" rows={12} {...form.register("content")} />
                      {form.formState.errors.content && (
                        <p className="text-sm text-destructive">{form.formState.errors.content.message}</p>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="category">Категория *</Label>
                        <Input id="category" {...form.register("category")} placeholder="Уход за кожей" />
                        {form.formState.errors.category && (
                          <p className="text-sm text-destructive">{form.formState.errors.category.message}</p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="author">Автор *</Label>
                        <Input id="author" {...form.register("author")} placeholder="Админ" />
                        {form.formState.errors.author && (
                          <p className="text-sm text-destructive">{form.formState.errors.author.message}</p>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="read_time">Время чтения (мин) *</Label>
                        <Input id="read_time" type="number" min={1} {...form.register("read_time")} />
                        {form.formState.errors.read_time && (
                          <p className="text-sm text-destructive">{form.formState.errors.read_time.message}</p>
                        )}
                      </div>
                    </div>

                    <TagSelector
                      value={watched.tagsText
                        ? watched.tagsText.split(",").map((t) => t.trim()).filter(Boolean)
                        : []}
                      onChange={(tags) => form.setValue("tagsText", tags.join(", "))}
                    />
                  </CardContent>
                </Card>
              </TabsContent>
            )}

            <TabsContent value="preview" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Предпросмотр</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h2 className="text-xl font-semibold text-foreground">{previewPost.title || "(без заголовка)"}</h2>
                    <p className="text-sm text-muted-foreground">{previewPost.excerpt}</p>
                  </div>

                  {existingImage && (
                    <div className="rounded-lg overflow-hidden bg-muted">
                      <img
                        src={existingImage.startsWith('/') ? `${import.meta.env.VITE_API_BASE_URL}${existingImage}` : existingImage}
                        alt={previewPost.title}
                        className="w-full h-auto"
                        loading="lazy"
                      />
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2">
                    {previewPost.category && <span className="text-sm text-muted-foreground">Категория: {previewPost.category}</span>}
                    {previewPost.author && <span className="text-sm text-muted-foreground">Автор: {previewPost.author}</span>}
                    {previewPost.read_time ? (
                      <span className="text-sm text-muted-foreground">{previewPost.read_time} мин</span>
                    ) : null}
                  </div>

                  <div className="space-y-3">
                    <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                      {previewPost.content}
                    </ReactMarkdown>
                  </div>

                  {previewPost.tags && previewPost.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-4 border-t border-border">
                      {previewPost.tags.map((tag, idx) => (
                        <span key={idx} className="px-2 py-1 bg-muted text-xs rounded">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Изображение</CardTitle>
            </CardHeader>
            <CardContent>
              <ImageUpload
                value={existingImage}
                onChange={setImageFile}
                onRemove={() => setExistingImage("")}
                aspectRatio="video"
                disabled={!canEdit}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
