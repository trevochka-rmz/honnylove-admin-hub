import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { User, Mail, Phone, MapPin, Shield, Calendar, Users, ShoppingCart } from 'lucide-react';

export default function ProfilePage() {
  const { user } = useAuth();

  if (!user) {
    return null;
  }

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return <Badge className="bg-primary text-primary-foreground">Администратор</Badge>;
      case 'manager':
        return <Badge variant="secondary">Менеджер</Badge>;
      default:
        return <Badge variant="outline">{role}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Профиль</h1>
        <p className="text-muted-foreground">Информация о вашем аккаунте</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Profile Card */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Личные данные</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-4">
              <Avatar className="h-20 w-20 border-4 border-primary/20">
                <AvatarFallback className="bg-primary/10 text-primary text-xl font-bold">
                  {getInitials(user.first_name, user.last_name)}
                </AvatarFallback>
              </Avatar>
              <div>
                <h2 className="text-xl font-semibold">
                  {user.first_name} {user.last_name}
                </h2>
                <p className="text-muted-foreground">@{user.username}</p>
                <div className="mt-2">{getRoleBadge(user.role)}</div>
              </div>
            </div>

            <Separator />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <Mail className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{user.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <Phone className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Телефон</p>
                  <p className="font-medium">{user.phone || 'Не указан'}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <MapPin className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Адрес</p>
                  <p className="font-medium">{user.address || 'Не указан'}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <Shield className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Статус</p>
                  <p className="font-medium">
                    {user.is_active ? (
                      <span className="text-success">Активен</span>
                    ) : (
                      <span className="text-destructive">Неактивен</span>
                    )}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Card */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Статистика</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {(user as any).totalUsers !== undefined && (
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-3">
                    <Users className="h-5 w-5 text-primary" />
                    <span className="text-sm">Всего пользователей</span>
                  </div>
                  <span className="font-bold text-lg">{(user as any).totalUsers}</span>
                </div>
              )}

              {(user as any).activeOrdersCount !== undefined && (
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-3">
                    <ShoppingCart className="h-5 w-5 text-primary" />
                    <span className="text-sm">Активных заказов</span>
                  </div>
                  <span className="font-bold text-lg">{(user as any).activeOrdersCount}</span>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Даты</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Дата регистрации</p>
                  <p className="font-medium">{formatDate(user.created_at)}</p>
                </div>
              </div>

              <Separator />

              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Последнее обновление</p>
                  <p className="font-medium">{formatDate(user.updated_at)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
