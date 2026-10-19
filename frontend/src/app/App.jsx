import 'bootstrap/dist/css/bootstrap.min.css';

import React, { useState, useEffect } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { getIdTokenResult, onAuthStateChanged } from 'firebase/auth';
import { auth } from '../services/firebase';
import AppRoutes from './AppRoutes';
import { CartProvider } from '../storefront/features/cart/context/CartContext.jsx';

function App() {
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isCurrent = true;
    let authChangeId = 0;
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      const currentAuthChangeId = ++authChangeId;
      setLoading(true);

      if (!currentUser) {
        setUser(null);
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      try {
        const tokenResult = await getIdTokenResult(currentUser);
        if (isCurrent && currentAuthChangeId === authChangeId) {
          setUser(currentUser);
          setIsAdmin(tokenResult.claims.admin === true);
        }
      } catch (error) {
        console.error("Không thể xác minh quyền quản trị:", error);
        if (isCurrent && currentAuthChangeId === authChangeId) {
          setUser(currentUser);
          setIsAdmin(false);
        }
      } finally {
        if (isCurrent && currentAuthChangeId === authChangeId) {
          setLoading(false);
        }
      }
    });
    return () => {
      isCurrent = false;
      unsubscribe();
    };
  }, []);

  if (loading) {
    return <div className="text-center mt-5">Đang tải ứng dụng...</div>;
  }

  return (
    <CartProvider user={user}>
      <BrowserRouter>
        <AppRoutes user={user} isAdmin={isAdmin} />
      </BrowserRouter>
    </CartProvider>
  );
}

export default App