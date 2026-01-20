import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import {
  Package,
  FolderTree,
  Award,
  LogOut,
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  User,
  BookOpen,
  ShoppingCart,
  Users,
  Image as ImageIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useState } from 'react';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Главная' },
  { to: '/products', icon: Package, label: 'Товары' },
  { to: '/orders', icon: ShoppingCart, label: 'Заказы' },
  { to: '/users', icon: Users, label: 'Пользователи' },
  { to: '/brands', icon: Award, label: 'Бренды' },
  { to: '/categories', icon: FolderTree, label: 'Категории' },
  { to: '/blogs', icon: BookOpen, label: 'Блоги' },
  { to: '/banners', icon: ImageIcon, label: 'Баннеры' },
];

export function AdminSidebar() {
  const { user, logout, isAdmin } = useAuth();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  return (
    <aside
      className={cn(
        'h-screen bg-sidebar text-sidebar-foreground flex flex-col transition-all duration-300 sticky top-0',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Header */}
      <div className="p-4 flex items-center justify-between">
        {!collapsed && (
          <div className="animate-slide-in-left">
            <h1 className="font-bold text-lg text-sidebar-foreground">HonnyLove</h1>
            <p className="text-xs text-sidebar-muted">Админ-панель</p>
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(!collapsed)}
          className="text-sidebar-muted hover:text-sidebar-foreground hover:bg-sidebar-accent h-8 w-8"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>

      <Separator className="bg-sidebar-border" />

      {/* User Profile - Clickable */}
      <NavLink to="/profile" className={cn('p-4 hover:bg-sidebar-accent transition-colors', collapsed && 'flex justify-center')}>
        <div className={cn('flex items-center gap-3', collapsed && 'flex-col')}>
          <Avatar className="h-10 w-10 border-2 border-sidebar-primary">
            <AvatarFallback className="bg-sidebar-accent text-sidebar-foreground text-sm font-medium">
              {user ? getInitials(user.first_name, user.last_name) : 'AD'}
            </AvatarFallback>
          </Avatar>
          {!collapsed && user && (
            <div className="flex-1 min-w-0 animate-slide-in-left">
              <p className="font-medium text-sm truncate">
                {user.first_name} {user.last_name}
              </p>
              <div className="flex items-center gap-2">
                <p className="text-xs text-sidebar-muted truncate">{user.email}</p>
              </div>
              <Badge variant="outline" className="mt-1 text-[10px] border-sidebar-primary text-sidebar-primary">
                {isAdmin ? 'Админ' : 'Менеджер'}
              </Badge>
            </div>
          )}
        </div>
      </NavLink>

      <Separator className="bg-sidebar-border" />

      {/* Navigation */}
      <nav className="flex-1 p-2 space-y-1 overflow-y-auto scrollbar-thin">
        {navItems.map((item) => {
          const isActive = location.pathname === item.to || 
            (item.to !== '/' && location.pathname.startsWith(item.to));
          
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200',
                collapsed && 'justify-center px-2',
                isActive
                  ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-md'
                  : 'text-sidebar-muted hover:text-sidebar-foreground hover:bg-sidebar-accent'
              )}
            >
              <item.icon className={cn('h-5 w-5 flex-shrink-0', isActive && 'text-sidebar-primary-foreground')} />
              {!collapsed && <span className="text-sm font-medium">{item.label}</span>}
            </NavLink>
          );
        })}
      </nav>

      <Separator className="bg-sidebar-border" />

      {/* Logout */}
      <div className="p-2">
        <button
          onClick={logout}
          className={cn(
            'flex items-center gap-3 px-3 py-2.5 rounded-lg w-full transition-colors',
            'text-sidebar-muted hover:text-destructive hover:bg-sidebar-accent',
            collapsed && 'justify-center px-2'
          )}
        >
          <LogOut className="h-5 w-5 flex-shrink-0" />
          {!collapsed && <span className="text-sm font-medium">Выйти</span>}
        </button>
      </div>
    </aside>
  );
}
