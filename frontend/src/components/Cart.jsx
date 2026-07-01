import React, { useState } from 'react';
import { X, Trash2, Plus, Minus, CreditCard, ShoppingBag } from 'lucide-react';

export default function Cart({ cart, onClose, onUpdateQty, onRemove, user, onOrderSuccess }) {
  const [address, setAddress] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (cart.length === 0) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content animate-fade-in" style={{ padding: '30px' }} onClick={(e) => e.stopPropagation()}>
          <button style={styles.closeBtn} onClick={onClose}><X size={20} /></button>
          <div style={styles.emptyCartContainer}>
            <ShoppingBag size={64} style={styles.emptyIcon} />
            <h3 style={{ fontSize: '1.4rem', marginBottom: '8px' }}>Your Cart is Empty</h3>
            <p style={{ color: 'var(--text-sub)', fontSize: '0.9rem', marginBottom: '20px' }}>
              Add items from your favorite restaurants to start a feast!
            </p>
            <button className="btn btn-primary" onClick={onClose}>Browse Restaurants</button>
          </div>
        </div>
      </div>
    );
  }

  // Calculate prices
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const deliveryFee = 3.99;
  const tax = subtotal * 0.08; // 8% sales tax
  const total = subtotal + deliveryFee + tax;

  const handleCheckout = async (e) => {
    e.preventDefault();
    if (!user) {
      setError('Please sign in to place an order.');
      return;
    }
    if (!address.trim()) {
      setError('Delivery address is required.');
      return;
    }

    setError('');
    setLoading(true);

    // Group items for API
    const itemsPayload = cart.map(item => ({
      menu_item_id: item.id,
      quantity: item.quantity
    }));

    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          restaurant_id: cart[0].restaurant_id,
          delivery_address: address,
          items: itemsPayload
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to place order');
      }

      onOrderSuccess(data.order_id);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content animate-fade-in" style={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={styles.header}>
          <h2 style={styles.title}>Your Order</h2>
          <button style={styles.closeBtn} onClick={onClose}><X size={20} /></button>
        </div>

        {error && <div style={styles.errorAlert}>{error}</div>}

        {/* Cart items list */}
        <div style={styles.itemsList}>
          {cart.map((item) => (
            <div key={item.id} style={styles.itemRow}>
              <div style={styles.itemMeta}>
                <div style={styles.itemName}>{item.name}</div>
                <div style={styles.itemPrice}>₹{item.price.toFixed(2)} each</div>
              </div>
              
              <div style={styles.itemControls}>
                <div style={styles.quantitySelector}>
                  <button style={styles.qtyBtn} onClick={() => onUpdateQty(item.id, -1)}><Minus size={12} /></button>
                  <span style={styles.qtyText}>{item.quantity}</span>
                  <button style={styles.qtyBtn} onClick={() => onUpdateQty(item.id, 1)}><Plus size={12} /></button>
                </div>
                
                <span style={styles.rowTotal}>₹{(item.price * item.quantity).toFixed(2)}</span>
                
                <button style={styles.deleteBtn} onClick={() => onRemove(item.id)}><Trash2 size={16} /></button>
              </div>
            </div>
          ))}
        </div>

        {/* Pricing Summary */}
        <div style={styles.summaryContainer}>
          <div style={styles.summaryRow}>
            <span>Subtotal</span>
            <span>₹{subtotal.toFixed(2)}</span>
          </div>
          <div style={styles.summaryRow}>
            <span>Delivery Fee</span>
            <span>₹{deliveryFee.toFixed(2)}</span>
          </div>
          <div style={styles.summaryRow}>
            <span>Estimated Tax (8%)</span>
            <span>₹{tax.toFixed(2)}</span>
          </div>
          <div style={{ ...styles.summaryRow, ...styles.totalRow }}>
            <span>Total</span>
            <span>₹{total.toFixed(2)}</span>
          </div>
        </div>

        {/* Checkout Form */}
        <form onSubmit={handleCheckout} style={styles.form}>
          <div className="form-group">
            <label className="form-label">Delivery Address</label>
            <input 
              type="text" 
              className="form-input" 
              placeholder="123 Main St, Apartment 4B" 
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              required
            />
          </div>

          <button 
            type="submit" 
            className="btn btn-primary" 
            style={styles.checkoutBtn} 
            disabled={loading}
          >
            <CreditCard size={18} />
            {loading ? 'Placing Order...' : `Place Order • ₹${total.toFixed(2)}`}
          </button>
        </form>
      </div>
    </div>
  );
}

const styles = {
  modal: {
    padding: '30px',
    maxWidth: '520px',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
  },
  title: {
    fontSize: '1.5rem',
    fontWeight: '800',
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--text-muted)',
    cursor: 'pointer',
    padding: '6px',
    borderRadius: '50%',
    transition: 'all 0.2s',
  },
  emptyCartContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    padding: '30px 0',
  },
  emptyIcon: {
    color: 'var(--text-muted)',
    marginBottom: '20px',
    opacity: 0.5,
  },
  itemsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    maxHeight: '220px',
    overflowY: 'auto',
    paddingRight: '6px',
    borderBottom: '1px solid rgba(255,255,255,0.06)',
    paddingBottom: '20px',
    marginBottom: '20px',
  },
  itemRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '12px',
  },
  itemMeta: {
    flex: 1,
  },
  itemName: {
    fontWeight: '600',
    fontSize: '0.95rem',
  },
  itemPrice: {
    fontSize: '0.78rem',
    color: 'var(--text-muted)',
    marginTop: '2px',
  },
  itemControls: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  quantitySelector: {
    display: 'flex',
    alignItems: 'center',
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: '6px',
    padding: '2px',
  },
  qtyBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--text-main)',
    cursor: 'pointer',
    width: '20px',
    height: '20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '4px',
  },
  qtyText: {
    width: '20px',
    textAlign: 'center',
    fontSize: '0.85rem',
    fontWeight: '600',
  },
  rowTotal: {
    fontWeight: '600',
    fontFamily: "'Outfit', sans-serif",
    fontSize: '0.95rem',
    minWidth: '60px',
    textAlign: 'right',
  },
  deleteBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--text-muted)',
    cursor: 'pointer',
    padding: '4px',
    transition: 'color 0.2s',
  },
  summaryContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    marginBottom: '24px',
    paddingBottom: '16px',
    borderBottom: '1px solid rgba(255,255,255,0.06)',
  },
  summaryRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '0.9rem',
    color: 'var(--text-sub)',
  },
  totalRow: {
    fontSize: '1.15rem',
    fontWeight: '700',
    color: 'var(--text-main)',
    fontFamily: "'Outfit', sans-serif",
    marginTop: '4px',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  checkoutBtn: {
    padding: '14px',
    borderRadius: '12px',
    width: '100%',
  },
  errorAlert: {
    background: 'rgba(231, 29, 54, 0.1)',
    color: 'var(--danger)',
    padding: '10px',
    borderRadius: '8px',
    fontSize: '0.82rem',
    marginBottom: '16px',
    textAlign: 'center',
  },
};
