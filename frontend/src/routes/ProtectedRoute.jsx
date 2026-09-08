import { Navigate } from 'react-router-dom';

// 1. Dành cho trang BẮT BUỘC PHẢI ĐĂNG NHẬP (VD: Giỏ hàng, Trang cá nhân...)
export const ProtectedRoute = ({ user, children }) => {
  if (!user) {
    // Nếu chưa đăng nhập, đá thẳng về trang login
    return <Navigate to="/login" replace />;
  }
  return children;
};

// 2. Dành cho trang KHÔNG ĐƯỢC PHẢI ĐĂNG NHẬP (VD: Login, Register)
export const PublicOnlyRoute = ({ user, children }) => {
  if (user) {
    // Nếu đã đăng nhập rồi mà cố vào login/register, đá về trang chủ
    return <Navigate to="/" replace />;
  }
  return children;
};