import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import type { User } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Loader2, User as UserIcon, Mail, Phone, MapPin, Calendar, Shield } from 'lucide-react';

export default function UserEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    if (id) loadUser(id);
  }, [id]);

  const loadUser = async (userId: string) => {
    setIsLoading(true);
    try {
      const data = await api.getUser(Number(userId));
      setUser(data);
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось загрузить пользователя',
        variant: 'destructive',
      });
      navigate('/users');
    } finally {
      setIsLoading(false);
    }
  };

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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/users')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold text-foreground">Пользователь не найден</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/users')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-foreground">
            {user.first_name || user.last_name
              ? `${user.first_name || ''} ${user.last_name || ''}`.trim()
              : user.username}
          </h1>
          <p className="text-muted-foreground">ID: {user.id}</p>
        </div>
        {getRoleBadge(user.role)}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserIcon className="h-5 w-5" />
              Основная информация
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Имя</p>
                <p className="font-medium">{user.first_name || '—'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Фамилия</p>
                <p className="font-medium">{user.last_name || '—'}</p>
              </div>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Логин</p>
              <p className="font-medium">@{user.username}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Контакты
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span>{user.email}</span>
            </div>
            <div className="flex items-center gap-3">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span>{user.phone || '—'}</span>
            </div>
            <div className="flex items-start gap-3">
              <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
              <span>{user.address || '—'}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Статус
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Роль</span>
              {getRoleBadge(user.role)}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Активен</span>
              {user.is_active ? (
                <Badge variant="outline" className="text-success border-success">Да</Badge>
              ) : (
                <Badge variant="outline" className="text-destructive border-destructive">Нет</Badge>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Даты
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Создан</span>
              <span>{new Date(user.created_at).toLocaleString('ru-RU')}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Обновлён</span>
              <span>{new Date(user.updated_at).toLocaleString('ru-RU')}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
