import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, FolderTree, Award, TrendingUp, Users, UserCheck, Shield, Briefcase } from 'lucide-react';
import { Link } from 'react-router-dom';
import { api } from '@/lib/api';
import type { UsersStats } from '@/types';
import { cn } from '@/lib/utils';

export default function DashboardPage() {
  const { user } = useAuth();
  const isStrictAdmin = user?.role === 'admin';
  const [stats, setStats] = useState<UsersStats | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await api.getUsers({ page: 1, limit: 1 });
        if (!cancelled) setStats(data.stats);
      } catch {
        // global toast handled in api
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const quickLinks = [
    {
      to: '/products',
      icon: Package,
      title: 'Товары',
      description: 'Управление каталогом товаров',
      color: 'bg-primary/10 text-primary',
    },
    {
      to: '/categories',
      icon: FolderTree,
      title: 'Категории',
      description: 'Структура категорий магазина',
      color: 'bg-accent text-accent-foreground',
    },
    {
      to: '/brands',
      icon: Award,
      title: 'Бренды',
      description: 'Список брендов',
      color: 'bg-warning/10 text-warning',
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome */}
      <div className="bg-gradient-to-r from-sidebar to-sidebar/80 rounded-xl p-6 text-sidebar-foreground">
        <h1 className="text-2xl font-bold mb-2">
          Добро пожаловать, {user?.first_name}!
        </h1>
        <p className="text-sidebar-muted">
          Панель управления магазином HonnyLove
        </p>
      </div>

      {/* Users Stats */}
      {stats && (
        <div className={cn(
          "grid gap-4",
          isStrictAdmin ? "grid-cols-2 md:grid-cols-4" : "grid-cols-1 sm:grid-cols-2"
        )}>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
                <Users className="h-5 w-5 text-secondary-foreground" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Всего клиентов</p>
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

      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {quickLinks.map((link) => (
          <Link key={link.to} to={link.to}>
            <Card className="h-full transition-all duration-200 hover:shadow-card-hover hover:-translate-y-0.5 cursor-pointer group">
              <CardContent className="p-6">
                <div
                  className={`w-12 h-12 rounded-lg ${link.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}
                >
                  <link.icon className="h-6 w-6" />
                </div>
                <h3 className="font-semibold text-foreground mb-1">{link.title}</h3>
                <p className="text-sm text-muted-foreground">{link.description}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Быстрый старт
          </CardTitle>
        </CardHeader>
        <CardContent className="text-muted-foreground">
          <p>
            Используйте боковую панель для навигации между разделами. Вы можете управлять
            товарами, просматривать категории и бренды. Для редактирования товара нажмите
            на иконку карандаша в таблице товаров.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
