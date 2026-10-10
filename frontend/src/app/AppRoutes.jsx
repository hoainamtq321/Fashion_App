import { Routes, Route } from "react-router-dom";
import StorefrontLayout from "../storefront/layouts/StorefrontLayout";
import HomePage from "../storefront/pages/home/HomePage";
import LoginPage from "../storefront/features/auth/pages/LoginPage";
import RegisterPage from "../storefront/features/auth/pages/RegisterPage";
import NotFoundPage from "./pages/NotFoundPage";
import ProductDetailPage from "../storefront/features/products/pages/ProductDetailPage";
import CartPage from "../storefront/features/cart/pages/CartPage";
import AdminLayout from "../admin/layouts/AdminLayout";
import { AdminDataProvider } from "../admin/context/AdminDataProvider";
import DashboardPage from "../admin/pages/dashboard/DashboardPage";
import AdminProductPage from "../admin/pages/products/AdminProductPage";
import AdminOrderPage from "../admin/pages/orders/AdminOrderPage";

import { ProtectedRoute, PublicOnlyRoute } from "./ProtectedRoute";

const AppRoutes = ({ user }) => {
  return (
    <Routes>
      <Route element={<StorefrontLayout user={user} />}>
        {/* Trang chủ */}
        <Route index element={<HomePage />} />
        <Route path="products/:productId" element={<ProductDetailPage />} />
        <Route path="cart" element={<CartPage />} />

        {/* Các trang chỉ cho khách CHƯA ĐĂNG NHẬP vào (Login, Register) */}
        <Route
          path="login"
          element={
            <PublicOnlyRoute user={user}>
              <LoginPage />
            </PublicOnlyRoute>
          }
        />
        <Route
          path="register"
          element={
            <PublicOnlyRoute user={user}>
              <RegisterPage />
            </PublicOnlyRoute>
          }
        />

        {/* CÁC TRANG ĐẶC BIỆT: Bắt buộc phải đăng nhập mới được vào */}
        <Route
          path="profile"
          element={
            <ProtectedRoute user={user}>
              <div>Trang cá nhân</div>
            </ProtectedRoute>
          }
        />

      </Route>

      <Route path="admin" element={<AdminDataProvider><AdminLayout /></AdminDataProvider>}>
        <Route index element={<DashboardPage />} />
        <Route path="products" element={<AdminProductPage />} />
        <Route path="orders" element={<AdminOrderPage />} />
      </Route>

      {/* 404 – LUÔN ĐẶT CUỐI */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export default AppRoutes;
