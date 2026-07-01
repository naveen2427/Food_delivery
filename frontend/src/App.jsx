import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Auth from './components/Auth';
import RestaurantList from './components/RestaurantList';
import RestaurantDetail from './components/RestaurantDetail';
import Cart from './components/Cart';
import OrderTracking from './components/OrderTracking';
import AdminPanel from './components/AdminPanel';

export default function App() {
  const [page, setPage] = useState('restaurants'); // 'restaurants', 'restaurant-detail', 'orders', 'admin', 'auth'
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [selectedRestaurantId, setSelectedRestaurantId] = useState(null);
  
  // Cart state
  const [cart, setCart] = useState(() => {
    const saved = localStorage.getItem('cart');
    return saved ? JSON.parse(saved) : [];
  });
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Sync cart to localStorage
  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cart));
  }, [cart]);

  // Verify token on load
  useEffect(() => {
    if (token) {
      verifyToken(token);
    }
  }, [token]);

  const verifyToken = async (authToken) => {
    try {
      const response = await fetch('/api/auth/me', {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      const data = await response.json();
      if (response.ok) {
        setUser(data.user);
      } else {
        // Token invalid or expired
        handleLogout();
      }
    } catch (err) {
      console.error('Token verification failed:', err);
      handleLogout();
    }
  };

  const handleLoginSuccess = (loggedInUser, userToken) => {
    setUser(loggedInUser);
    setToken(userToken);
    localStorage.setItem('token', userToken);
    
    // Redirect based on role
    if (loggedInUser.role === 'customer') {
      setPage('restaurants');
    } else {
      setPage('admin');
    }
  };

  const handleLogout = async () => {
    if (token) {
      try {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` }
        });
      } catch (err) {
        console.error('Logout error:', err);
      }
    }
    setUser(null);
    setToken('');
    localStorage.removeItem('token');
    setCart([]);
    setPage('restaurants');
  };

  const handleAddToCart = (item, quantity) => {
    setCart(prev => {
      // 1. Check if item is from same restaurant
      if (prev.length > 0 && prev[0].restaurant_id !== item.restaurant_id) {
        const confirmClear = window.confirm(
          'Your cart contains items from another restaurant. Would you like to clear your cart and add this item?'
        );
        if (!confirmClear) return prev;
        return [{ ...item, quantity }];
      }

      // 2. Add or update quantity
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        return prev.map(i => i.id === item.id 
          ? { ...i, quantity: i.quantity + quantity }
          : i
        );
      }
      return [...prev, { ...item, quantity }];
    });
    
    // Optional feedback toast
    setIsCartOpen(true);
  };

  const handleUpdateCartQty = (itemId, change) => {
    setCart(prev => prev.map(item => {
      if (item.id === itemId) {
        const newQty = item.quantity + change;
        return newQty < 1 ? null : { ...item, quantity: newQty };
      }
      return item;
    }).filter(Boolean));
  };

  const handleRemoveFromCart = (itemId) => {
    setCart(prev => prev.filter(item => item.id !== itemId));
  };

  const handleOrderSuccess = (orderId) => {
    setCart([]);
    setIsCartOpen(false);
    setPage('orders');
  };

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navbar 
        user={user} 
        onLogout={handleLogout} 
        setPage={setPage} 
        cartCount={cartCount} 
        openCart={() => setIsCartOpen(true)}
      />

      <main style={{ flex: 1 }}>
        {page === 'restaurants' && (
          <RestaurantList 
            setRestaurantId={setSelectedRestaurantId} 
            setPage={setPage} 
          />
        )}

        {page === 'restaurant-detail' && (
          <RestaurantDetail 
            restaurantId={selectedRestaurantId} 
            onBack={() => setPage('restaurants')}
            user={user}
            onAddToCart={handleAddToCart}
          />
        )}

        {page === 'auth' && (
          <Auth 
            onLoginSuccess={handleLoginSuccess} 
            setPage={setPage}
          />
        )}

        {page === 'orders' && user && (
          <OrderTracking user={user} />
        )}

        {page === 'admin' && user && (
          <AdminPanel user={user} />
        )}
      </main>

      {/* Cart Modal Overlay */}
      {isCartOpen && (
        <Cart 
          cart={cart} 
          onClose={() => setIsCartOpen(false)}
          onUpdateQty={handleUpdateCartQty}
          onRemove={handleRemoveFromCart}
          user={user}
          onOrderSuccess={handleOrderSuccess}
        />
      )}

      {/* Premium Footer */}
      <footer style={styles.footer}>
        <div className="container" style={styles.footerContent}>
          <div>&copy; {new Date().getFullYear()} FeastExpress Inc. All rights reserved.</div>
          <div style={styles.footerLinks}>
            <a href="#" style={styles.footerLink}>Terms</a>
            <a href="#" style={styles.footerLink}>Privacy</a>
            <a href="#" style={styles.footerLink}>Security</a>
            <a href="#" style={styles.footerLink}>Partner Portal</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

const styles = {
  footer: {
    background: '#090a0d',
    borderTop: '1px solid rgba(255,255,255,0.05)',
    padding: '24px 0',
    color: 'var(--text-muted)',
    fontSize: '0.85rem',
  },
  footerContent: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '12px',
  },
  footerLinks: {
    display: 'flex',
    gap: '20px',
  },
  footerLink: {
    color: 'var(--text-muted)',
    textDecoration: 'none',
    transition: 'color 0.2s',
  },
};
