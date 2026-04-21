import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import type { User, UsersStats } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Search, Loader2, Users, ShieldCheck, UserCheck, Shield, Briefcase, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';

export default function UsersPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user: currentUser } = useAuth();
  const isStrictAdmin = currentUser?.role === 'admin';

  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<UsersStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(false);
  const hasLoadedRef = useRef(false);
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebouncedValue(searchTerm, 400);
  const [roleFilter, setRoleFilter] = useState<'' | 'customer' | 'manager' | 'admin'>('');
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    loadUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, roleFilter, debouncedSearch]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [roleFilter, debouncedSearch]);

  const loadUsers = async () => {
    const firstLoad = !hasLoadedRef.current;
    if (firstLoad) setIsLoading(true);
    else setIsFetching(true);

    try {
      const data = await api.getUsers({
        page,
        limit,
        role: roleFilter || undefined,
        search: debouncedSearch || undefined,
      });
      setUsers(data.users);
      setStats(data.stats);
      setTotalPages(data.pages || 1);
      setTotal(data.total || 0);
      hasLoadedRef.current = true;
    } catch (error) {
      // Global toast already shown by api client
    } finally {
      setIsLoading(false);
      setIsFetching(false);
    }
  };

  const filteredUsers = users;

  const getRoleBadge = (role: string | null) => {
    switch (role) {
      case 'admin':
        return <Badge className="bg-primary/10 text-primary">Админ</Badge>;
      case 'manager':
        return <Badge className="bg-warning/10 text-warning">Менеджер</Badge>;
      case 'customer':
        return <Badge variant="secondary">Клиент</Badge>;
      default:
        return <Badge variant="outline">—</Badge>;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Пользователи</h1>
          <p className="text-muted-foreground flex items-center gap-2">
            Всего {total} пользователей
            {isFetching && !isLoading && (
              <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
            )}
          </p>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className={cn(
          "grid gap-4",
          isStrictAdmin ? "grid-cols-2 md:grid-cols-4" : "grid-cols-2"
        )}>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
                <Users className="h-5 w-5 text-secondary-foreground" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Клиентов</p>
                <p className="text-xl font-semibold">{stats.customerCount}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
                <UserCheck className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Подтверждённых</p>
                <p className="text-xl font-semibold">{stats.verifiedUsers}</p>
              </div>
            </CardContent>
          </Card>
          {isStrictAdmin && (
            <>
              <Card>
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center">
                    <Briefcase className="h-5 w-5 text-warning" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Менеджеров</p>
                    <p className="text-xl font-semibold">{stats.managerCount}</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Shield className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Админов</p>
                    <p className="text-xl font-semibold">{stats.adminCount}</p>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      )}

      {/* Search */}
      <Card>
        <CardContent className="p-4 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Поиск по имени, email или логину..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={roleFilter || 'all'} onValueChange={(v) => setRoleFilter(v === 'all' ? '' : v as any)}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Роль" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все роли</SelectItem>
              <SelectItem value="customer">Клиенты</SelectItem>
              <SelectItem value="manager">Менеджеры</SelectItem>
              {isStrictAdmin && <SelectItem value="admin">Админы</SelectItem>}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
              <Users className="h-12 w-12 mb-4 opacity-50" />
              <p className="text-lg font-medium">Пользователи не найдены</p>
              <p className="text-sm">Попробуйте изменить поиск</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="w-16">ID</TableHead>
                    <TableHead>Пользователь</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Телефон</TableHead>
                    <TableHead>Роль</TableHead>
                    <TableHead className="text-center">Статус</TableHead>
                    <TableHead>Создан</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow
                      key={user.id}
                      className="group hover:bg-muted/30 cursor-pointer"
                      onClick={() => navigate(`/users/${user.id}`)}
                    >
                      <TableCell className="font-mono text-sm">{user.id}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium text-foreground">
                            {user.first_name || user.last_name
                              ? `${user.first_name || ''} ${user.last_name || ''}`.trim()
                              : '—'}
                          </p>
                          <p className="text-xs text-muted-foreground">@{user.username}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">{user.email}</TableCell>
                      <TableCell className="text-sm">{user.phone || '—'}</TableCell>
                      <TableCell>{getRoleBadge(user.role)}</TableCell>
                      <TableCell className="text-center">
                        {user.is_active ? (
                          <Badge variant="outline" className="text-success border-success text-xs">
                            Активен
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-destructive border-destructive text-xs">
                            Неактивен
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(user.created_at).toLocaleDateString('ru-RU')}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
