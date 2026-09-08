import { Routes, Route } from "react-router-dom";
import MainLayout from "../layouts/MainLayout";
import Home from "../pages/home/HomePage";
import Login from "../pages/auth/LoginPage";
import Register from "../pages/auth/RegisterPage";
import NotFound from "../pages/NotFound/NotFoundPage";

import { ProtectedRoute, PublicOnlyRoute } from "./ProtectedRoute";

const AppRoutes = ({ user }) => {
  return (
    <Routes>
      <Route path="/" element={<MainLayout user={user} />}>
        {/* Trang chủ */}
        <Route index element={<Home />} />


        {/* Các trang chỉ cho khách CHƯA ĐĂNG NHẬP vào (Login, Register) */}
        <Route 
          path="login" 
          element={
            <PublicOnlyRoute user={user}>
              <Login />
            </PublicOnlyRoute>
          } 
        />
        <Route 
          path="register" 
          element={
            <PublicOnlyRoute user={user}>
              <Register />
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

        {/* 404 – LUÔN ĐẶT CUỐI */}
        <Route path="*" element={<NotFound />} />
      </Route>

      {/* 404 – LUÔN ĐẶT CUỐI */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default AppRoutes;
