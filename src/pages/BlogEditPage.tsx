import { useEffect, useMemo, useState } from "react";
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

import { ArrowLeft, Loader2, Save, Trash2 } from "lucide-react";

const blogSchema = z.object({
  id: z.string().trim().min(1, "ID обязателен"),
  title: z.string().trim().min(1, "Заголовок обязателен"),
  excerpt: z.string().trim().min(1, "Анонс обязателен"),
  content: z.string().trim().min(1, "Контент обязателен"),
  image: z.string().trim().url("Нужен валидный URL изображения"),
  category: z.string().trim().min(1, "Категория обязательна"),
  author: z.string().trim().min(1, "Автор обязателен"),
  date: z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/, "Формат даты YYYY-MM-DD"),
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
      id: "",
      title: "",
      excerpt: "",
      content: "",
      image: "",
      category: "",
      author: "",
      date: new Date().toISOString().slice(0, 10),
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

  useEffect(() => {
    if (!blogQuery.data) return;
    const post = blogQuery.data;
    form.reset({
      id: post.id,
      title: post.title,
      excerpt: post.excerpt,
      content: post.content,
      image: post.image,
      category: post.category,
      author: post.author,
      date: post.date,
      read_time: post.read_time,
      tagsText: (post.tags ?? []).join(", "),
    });
  }, [blogQuery.data, form]);

  const watched = form.watch();
  const previewPost: BlogPost = useMemo(
    () => ({
      id: watched.id,
      title: watched.title,
      excerpt: watched.excerpt,
      content: watched.content,
      image: watched.image,
      category: watched.category,
      author: watched.author,
      date: watched.date,
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
    [watched]
  );

  const onSubmit = async (values: BlogFormValues) => {
    if (!canEdit) return;

    const tags = values.tagsText
      ? values.tagsText
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean)
      : [];

    const payload: BlogPost = {
      id: values.id,
      title: values.title,
      excerpt: values.excerpt,
      content: values.content,
      image: values.image,
      category: values.category,
      author: values.author,
      date: values.date,
      read_time: values.read_time,
      tags,
      created_at: "",
      updated_at: "",
    };

    setIsSaving(true);
    try {
      if (isNew) {
        await api.createBlog(payload);
        toast({ title: "Успешно", description: "Пост создан" });
      } else {
        await api.updateBlog(id as string, payload);
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
                      <Label htmlFor="id">ID *</Label>
                      <Input
                        id="id"
                        disabled={!isNew}
                        {...form.register("id")}
                        placeholder="Например: 7"
                      />
                      {form.formState.errors.id && (
                        <p className="text-sm text-destructive">{form.formState.errors.id.message}</p>
                      )}
                    </div>

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
                        <Label htmlFor="image">Изображение (URL) *</Label>
                        <Input id="image" {...form.register("image")} placeholder="https://..." />
                        {form.formState.errors.image && (
                          <p className="text-sm text-destructive">{form.formState.errors.image.message}</p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="category">Категория *</Label>
                        <Input id="category" {...form.register("category")} placeholder="Уход за кожей" />
                        {form.formState.errors.category && (
                          <p className="text-sm text-destructive">{form.formState.errors.category.message}</p>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="author">Автор *</Label>
                        <Input id="author" {...form.register("author")} placeholder="Админ" />
                        {form.formState.errors.author && (
                          <p className="text-sm text-destructive">{form.formState.errors.author.message}</p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="date">Дата *</Label>
                        <Input id="date" type="date" {...form.register("date")} />
                        {form.formState.errors.date && (
                          <p className="text-sm text-destructive">{form.formState.errors.date.message}</p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="read_time">Время чтения *</Label>
                        <Input id="read_time" type="number" min={1} {...form.register("read_time")} />
                        {form.formState.errors.read_time && (
                          <p className="text-sm text-destructive">{form.formState.errors.read_time.message}</p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="tagsText">Теги (через запятую)</Label>
                      <Input id="tagsText" {...form.register("tagsText")} placeholder="уход, советы" />
                    </div>
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

                  {previewPost.image && (
                    <div className="rounded-lg overflow-hidden bg-muted">
                      <img
                        src={previewPost.image}
                        alt={previewPost.title}
                        className="w-full h-auto"
                        loading="lazy"
                      />
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2">
                    {previewPost.category && <span className="text-sm text-muted-foreground">Категория: {previewPost.category}</span>}
                    {previewPost.author && <span className="text-sm text-muted-foreground">Автор: {previewPost.author}</span>}
                    {previewPost.date && <span className="text-sm text-muted-foreground">Дата: {previewPost.date}</span>}
                    {previewPost.read_time ? (
                      <span className="text-sm text-muted-foreground">{previewPost.read_time} мин</span>
                    ) : null}
                  </div>

                  <div className="space-y-3">
                    <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents as any}>
                      {previewPost.content || ""}
                    </ReactMarkdown>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Справка</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>Контент поддерживает Markdown (заголовки, списки, **жирный**, ссылки).</p>
              <p>HTML внутри Markdown не выполняется (безопасно).</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
