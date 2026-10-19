import { Navigate, useLocation } from 'react-router-dom';

// 1. Dành cho trang BẮT BUỘC PHẢI ĐĂNG NHẬP (VD: Giỏ hàng, Trang cá nhân...)
export const ProtectedRoute = ({ user, children }) => {
  const location = useLocation();
  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  return children;
};

export const AdminRoute = ({ isAdmin, children }) => {
  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }
  return children;
};

// 2. Dành cho trang KHÔNG ĐƯỢC PHẢI ĐĂNG NHẬP (VD: Login, Register)
export const PublicOnlyRoute = ({ user, children }) => {
  const location = useLocation();
  if (user) {
    return <Navigate to={location.state?.from || "/"} replace />;
  }
  return children;
};