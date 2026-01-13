import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import type { BlogPost } from "@/types";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useToast } from "@/hooks/use-toast";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
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

import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Plus,
  Search,
  Trash2,
} from "lucide-react";

export default function BlogsPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAdmin } = useAuth();

  const [page, setPage] = useState(1);
  const [limit] = useState(12);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 350);

  const queryParams = useMemo(
    () => ({ limit, page, search: debouncedSearch || undefined }),
    [limit, page, debouncedSearch]
  );

  const blogsQuery = useQuery({
    queryKey: ["blogs", queryParams],
    queryFn: () => api.getBlogs(queryParams),
    placeholderData: keepPreviousData,
    refetchOnWindowFocus: false,
  });

  const posts: BlogPost[] = blogsQuery.data?.posts ?? [];
  const pages = blogsQuery.data?.pages ?? 1;
  const total = blogsQuery.data?.total ?? 0;

  const handleDelete = async (id: string) => {
    try {
      await api.deleteBlog(id);
      toast({ title: "Удалено", description: "Пост удалён" });
      blogsQuery.refetch();
    } catch (e) {
      toast({
        title: "Ошибка",
        description: e instanceof Error ? e.message : "Не удалось удалить пост",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Блоги</h1>
          <p className="text-muted-foreground flex items-center gap-2">
            Всего {total} постов
            {blogsQuery.isFetching && !blogsQuery.isLoading && (
              <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
            )}
          </p>
        </div>
        {isAdmin && (
          <Button onClick={() => navigate("/blogs/new")}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Добавить пост
          </Button>
        )}
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Поиск по блогу..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {blogsQuery.isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : blogsQuery.isError ? (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
              <BookOpen className="h-12 w-12 mb-4 opacity-50" />
              <p className="text-lg font-medium">Не удалось загрузить блоги</p>
              <p className="text-sm">Попробуйте обновить страницу</p>
            </div>
          ) : posts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
              <BookOpen className="h-12 w-12 mb-4 opacity-50" />
              <p className="text-lg font-medium">Посты не найдены</p>
              <p className="text-sm">Попробуйте изменить поиск</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="min-w-[260px]">Заголовок</TableHead>
                    <TableHead>Категория</TableHead>
                    <TableHead>Автор</TableHead>
                    <TableHead>Дата</TableHead>
                    <TableHead className="text-right">Мин</TableHead>
                    <TableHead className="text-right">Теги</TableHead>
                    {isAdmin && <TableHead className="w-14" />}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {posts.map((post) => (
                    <TableRow
                      key={post.id}
                      className="group hover:bg-muted/30 cursor-pointer"
                      onClick={() => navigate(`/blogs/${post.id}`)}
                    >
                      <TableCell>
                        <div className="max-w-[520px]">
                          <p className="font-medium text-foreground line-clamp-1">{post.title}</p>
                          <p className="text-xs text-muted-foreground line-clamp-1">{post.excerpt}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="whitespace-nowrap">
                          {post.category}
                        </Badge>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">{post.author}</TableCell>
                      <TableCell className="whitespace-nowrap">{post.date}</TableCell>
                      <TableCell className="text-right">{post.read_time}</TableCell>
                      <TableCell className="text-right">{post.tags?.length ?? 0}</TableCell>

                      {isAdmin && (
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" aria-label="Удалить">
                                <Trash2 className="h-4 w-4 text-muted-foreground group-hover:text-foreground" />
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
                                <AlertDialogAction onClick={() => handleDelete(post.id)}>
                                  Удалить
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {pages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-border">
              <p className="text-sm text-muted-foreground">
                Страница {page} из {pages}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(pages, p + 1))}
                  disabled={page === pages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
