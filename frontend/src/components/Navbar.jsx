import React from 'react';
import { ShoppingCart, LogOut, User, ClipboardList, Shield, Store, Utensils } from 'lucide-react';

export default function Navbar({ user, onLogout, setPage, cartCount, openCart }) {
  return (
    <nav style={styles.nav}>
      <div className="container" style={styles.navContainer}>
        {/* Brand Logo */}
        <div style={styles.logo} onClick={() => setPage('restaurants')}>
          <Utensils size={24} style={styles.logoIcon} />
          <span>Feast<span style={styles.logoSpan}>Express</span></span>
        </div>

        {/* Navigation Links */}
        <div style={styles.navLinks}>
          <button style={styles.linkBtn} onClick={() => setPage('restaurants')}>
            Browse
          </button>
          
          {user && (
            <button style={styles.linkBtn} onClick={() => setPage('orders')}>
              <ClipboardList size={18} />
              <span>Orders</span>
            </button>
          )}

          {user && user.role === 'owner' && (
            <button style={styles.linkBtnOwner} onClick={() => setPage('admin')}>
              <Store size={18} />
              <span>Owner Panel</span>
            </button>
          )}

          {user && user.role === 'admin' && (
            <button style={styles.linkBtnAdmin} onClick={() => setPage('admin')}>
              <Shield size={18} />
              <span>Admin Panel</span>
            </button>
          )}
        </div>

        {/* User profile & Cart Controls */}
        <div style={styles.userSection}>
          {user ? (
            <>
              {user.role === 'customer' && (
                <button style={styles.cartBtn} onClick={openCart}>
                  <ShoppingCart size={20} />
                  {cartCount > 0 && <span style={styles.cartBadge}>{cartCount}</span>}
                </button>
              )}
              
              <div style={styles.profileBox}>
                <User size={16} style={styles.profileIcon} />
                <div style={styles.profileDetails}>
                  <div style={styles.username}>{user.username}</div>
                  <div style={styles.roleLabel}>{user.role}</div>
                </div>
              </div>

              <button style={styles.logoutBtn} onClick={onLogout} title="Log Out">
                <LogOut size={18} />
              </button>
            </>
          ) : (
            <button className="btn btn-primary" onClick={() => setPage('auth')}>
              Sign In
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}

const styles = {
  nav: {
    height: '70px',
    background: 'rgba(11, 12, 16, 0.75)',
    backdropFilter: 'blur(16px)',
    borderBottom: '1px solid rgba(255,255,255,0.06)',
    position: 'sticky',
    top: 0,
    zIndex: 900,
  },
  navContainer: {
    display: 'flex',
    alignItems: 'center',
    height: '100%',
    justifyContent: 'space-between',
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '1.4rem',
    fontWeight: '800',
    fontFamily: "'Outfit', sans-serif",
    cursor: 'pointer',
    userSelect: 'none',
  },
  logoIcon: {
    color: 'var(--primary)',
  },
  logoSpan: {
    color: 'var(--secondary)',
  },
  navLinks: {
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
  },
  linkBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--text-sub)',
    fontSize: '0.95rem',
    fontWeight: '500',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 12px',
    borderRadius: '8px',
    transition: 'all 0.2s',
  },
  linkBtnOwner: {
    background: 'rgba(255, 182, 39, 0.08)',
    border: '1px solid rgba(255, 182, 39, 0.2)',
    color: 'var(--secondary)',
    fontSize: '0.95rem',
    fontWeight: '600',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '6px 12px',
    borderRadius: '8px',
    transition: 'all 0.2s',
  },
  linkBtnAdmin: {
    background: 'rgba(46, 196, 182, 0.08)',
    border: '1px solid rgba(46, 196, 182, 0.2)',
    color: 'var(--success)',
    fontSize: '0.95rem',
    fontWeight: '600',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '6px 12px',
    borderRadius: '8px',
    transition: 'all 0.2s',
  },
  userSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  cartBtn: {
    background: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    color: 'var(--text-main)',
    padding: '10px',
    borderRadius: '50%',
    cursor: 'pointer',
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s',
  },
  cartBadge: {
    position: 'absolute',
    top: '-4px',
    right: '-4px',
    background: 'var(--primary)',
    color: '#fff',
    fontSize: '0.7rem',
    fontWeight: '700',
    borderRadius: '50%',
    width: '18px',
    height: '18px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 2px 5px rgba(0,0,0,0.3)',
  },
  profileBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '4px 12px',
    background: 'rgba(255,255,255,0.03)',
    borderRadius: '20px',
    border: '1px solid rgba(255,255,255,0.05)',
  },
  profileIcon: {
    color: 'var(--text-sub)',
  },
  profileDetails: {
    display: 'flex',
    flexDirection: 'column',
  },
  username: {
    fontSize: '0.85rem',
    fontWeight: '600',
    color: 'var(--text-main)',
  },
  roleLabel: {
    fontSize: '0.65rem',
    color: 'var(--primary)',
    textTransform: 'uppercase',
    fontWeight: '700',
    marginTop: '-2px',
  },
  logoutBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--text-muted)',
    cursor: 'pointer',
    padding: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '8px',
    transition: 'all 0.2s',
  },
};
