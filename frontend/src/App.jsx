import 'bootstrap/dist/css/bootstrap.min.css';

import React, { useState, useEffect } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './services/firebase';
import AppRoutes from './routes/AppRoutes';
import { CartProvider } from './context/CartContext.jsx';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return <div className="text-center mt-5">Đang tải ứng dụng...</div>;
  }

  return (
    <CartProvider>
      <BrowserRouter>
        <AppRoutes user={user} />
      </BrowserRouter>
    </CartProvider>
  );
}

export default App