import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AdminLayout } from "@/components/layout/AdminLayout";
import LoginPage from "@/pages/LoginPage";
import DashboardPage from "@/pages/DashboardPage";
import ProductsPage from "@/pages/ProductsPage";
import ProductEditPage from "@/pages/ProductEditPage";
import CategoriesPage from "@/pages/CategoriesPage";
import CategoryEditPage from "@/pages/CategoryEditPage";
import BrandsPage from "@/pages/BrandsPage";
import BrandEditPage from "@/pages/BrandEditPage";
import BlogsPage from "@/pages/BlogsPage";
import BlogEditPage from "@/pages/BlogEditPage";
import BannersPage from "@/pages/BannersPage";
import BannerEditPage from "@/pages/BannerEditPage";
import ProfilePage from "@/pages/ProfilePage";
import OrdersPage from "@/pages/OrdersPage";
import OrderCreatePage from "@/pages/OrderCreatePage";
import OrderEditPage from "@/pages/OrderEditPage";
import UsersPage from "@/pages/UsersPage";
import UserEditPage from "@/pages/UserEditPage";
import PosPage from "@/pages/PosPage";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <AdminLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<DashboardPage />} />
              <Route path="products" element={<ProductsPage />} />
              <Route path="products/:id" element={<ProductEditPage />} />
              <Route path="orders" element={<OrdersPage />} />
              <Route path="orders/new" element={<OrderCreatePage />} />
              <Route path="orders/:id" element={<OrderEditPage />} />
              <Route path="users" element={<UsersPage />} />
              <Route path="users/:id" element={<UserEditPage />} />
              <Route path="categories" element={<CategoriesPage />} />
              <Route path="categories/:id" element={<CategoryEditPage />} />
              <Route path="brands" element={<BrandsPage />} />
              <Route path="brands/:id" element={<BrandEditPage />} />
              <Route path="blogs" element={<BlogsPage />} />
              <Route path="blogs/:id" element={<BlogEditPage />} />
              <Route path="banners" element={<BannersPage />} />
              <Route path="banners/:id" element={<BannerEditPage />} />
              <Route path="sales" element={<PosPage />} />
              <Route path="pos" element={<Navigate to="/sales" replace />} />
              <Route path="profile" element={<ProfilePage />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
