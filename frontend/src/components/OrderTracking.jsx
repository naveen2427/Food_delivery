import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, MapPin, Calendar, IndianRupee, Clock, CheckCircle } from 'lucide-react';

export default function OrderTracking({ user }) {
  const [orders, setOrders] = useState([]);
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [orderDetails, setOrderDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [detailsLoading, setDetailsLoading] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    if (selectedOrderId) {
      fetchOrderDetails(selectedOrderId);
    } else {
      setOrderDetails(null);
    }
  }, [selectedOrderId]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/orders', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      setOrders(data.orders || []);
      // Auto-select first order if exists
      if (data.orders && data.orders.length > 0) {
        setSelectedOrderId(data.orders[0].id);
      }
    } catch (err) {
      console.error('Error fetching orders:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchOrderDetails = async (id) => {
    setDetailsLoading(true);
    try {
      const response = await fetch(`/api/orders/${id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      setOrderDetails(data);
    } catch (err) {
      console.error('Error fetching order details:', err);
    } finally {
      setDetailsLoading(false);
    }
  };

  const getStatusStep = (status) => {
    const steps = ['Pending', 'Preparing', 'Out for Delivery', 'Delivered'];
    return steps.indexOf(status);
  };

  const renderTimeline = (status) => {
    const steps = [
      { label: 'Confirmed', desc: 'Order placed' },
      { label: 'Preparing', desc: 'Chef cooking' },
      { label: 'On The Way', desc: 'Rider en route' },
      { label: 'Delivered', desc: 'Arrived!' }
    ];
    
    const currentStep = getStatusStep(status);
    
    if (status === 'Cancelled') {
      return (
        <div style={styles.cancelledBox}>
          <h3>Order Cancelled</h3>
          <p>This order has been cancelled by the restaurant or administrator.</p>
        </div>
      );
    }

    return (
      <div style={styles.timelineWrapper}>
        <div style={styles.timelineRow}>
          {steps.map((step, idx) => {
            const isCompleted = idx < currentStep;
            const isActive = idx === currentStep;
            const isFuture = idx > currentStep;
            
            let circleStyle = styles.timelineCircle;
            if (isCompleted) circleStyle = { ...circleStyle, ...styles.timelineCircleCompleted };
            if (isActive) circleStyle = { ...circleStyle, ...styles.timelineCircleActive };
            
            return (
              <React.Fragment key={idx}>
                {/* Connecting Line */}
                {idx > 0 && (
                  <div style={{
                    ...styles.timelineLine,
                    ...(idx <= currentStep ? styles.timelineLineCompleted : {})
                  }} />
                )}
                
                {/* Step Circle */}
                <div style={styles.stepContainer}>
                  <div style={circleStyle}>
                    {isCompleted ? <CheckCircle size={16} /> : <span>{idx + 1}</span>}
                  </div>
                  <div style={styles.stepLabels}>
                    <div style={{
                      ...styles.stepLabelText,
                      ...(isActive ? { color: 'var(--primary)', fontWeight: '700' } : {})
                    }}>
                      {step.label}
                    </div>
                    <div style={styles.stepLabelDesc}>{step.desc}</div>
                  </div>
                </div>
              </React.Fragment>
            );
          })}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex-center" style={{ minHeight: '400px' }}>
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="container animate-fade-in" style={styles.page}>
      <h1 style={styles.title}>Track Your Orders</h1>
      
      {orders.length === 0 ? (
        <div className="glass-card" style={styles.emptyState}>
          <Clock size={48} style={{ color: 'var(--text-muted)', marginBottom: '16px' }} />
          <h3>No Orders Yet</h3>
          <p style={{ color: 'var(--text-sub)' }}>Place your first order to track it here!</p>
        </div>
      ) : (
        <div style={styles.layoutGrid}>
          {/* Left Column: Orders List */}
          <div style={styles.listColumn}>
            <h2 style={styles.subtitle}>Order History</h2>
            <div style={styles.ordersList}>
              {orders.map((o) => (
                <div 
                  key={o.id} 
                  className={`glass-card ${selectedOrderId === o.id ? 'active' : ''}`}
                  style={{
                    ...styles.orderCard,
                    ...(selectedOrderId === o.id ? styles.orderCardActive : {})
                  }}
                  onClick={() => setSelectedOrderId(o.id)}
                >
                  <div style={styles.cardHeader}>
                    <span style={styles.orderId}>Order #{o.id}</span>
                    <span className={`badge ${
                      o.status === 'Pending' ? 'badge-pending' :
                      o.status === 'Preparing' ? 'badge-preparing' :
                      o.status === 'Out for Delivery' ? 'badge-delivery' :
                      o.status === 'Delivered' ? 'badge-delivered' : 'badge-cancelled'
                    }`}>
                      {o.status}
                    </span>
                  </div>

                  <h3 style={styles.cardRestaurantName}>{o.restaurant_name}</h3>
                  
                  <div style={styles.cardMeta}>
                    <div style={styles.metaItem}>
                      <Calendar size={12} />
                      <span>{new Date(o.created_at).toLocaleDateString()}</span>
                    </div>
                    <div style={styles.metaItem}>
                      <IndianRupee size={12} />
                      <span style={{ fontWeight: '700' }}>₹{o.total_price.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: Tracking Details */}
          <div style={styles.detailsColumn}>
            {detailsLoading ? (
              <div className="flex-center" style={{ minHeight: '300px' }}>
                <div className="spinner"></div>
              </div>
            ) : orderDetails ? (
              <div className="glass-card animate-fade-in" style={styles.detailsCard}>
                <div style={styles.detailsHeader}>
                  <div>
                    <h2 style={styles.detailsTitle}>Tracking: Order #{orderDetails.order.id}</h2>
                    <p style={{ color: 'var(--text-sub)', fontSize: '0.85rem' }}>
                      From <strong style={{ color: '#fff' }}>{orderDetails.order.restaurant_name}</strong>
                    </p>
                  </div>
                  <button className="btn btn-secondary" onClick={fetchOrders} style={styles.refreshBtn}>
                    Refresh Status
                  </button>
                </div>

                {/* Timeline Status */}
                {renderTimeline(orderDetails.order.status)}

                {/* Order Summary */}
                <div style={styles.summaryBox}>
                  <h3 style={styles.boxTitle}>Items Summary</h3>
                  <div style={styles.itemsList}>
                    {orderDetails.items.map((item) => (
                      <div key={item.id} style={styles.itemRow}>
                        <span>{item.quantity} x {item.name}</span>
                        <span style={{ fontFamily: "'Outfit', sans-serif", fontWeight: '600' }}>
                          ₹{(item.price * item.quantity).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div style={styles.totalBox}>
                    <span>Total Amount Paid</span>
                    <span>₹{orderDetails.order.total_price.toFixed(2)}</span>
                  </div>
                </div>

                {/* Delivery Info */}
                <div style={styles.deliveryBox}>
                  <h3 style={styles.boxTitle}>Delivery Details</h3>
                  <div style={styles.infoRow}>
                    <MapPin size={16} style={{ color: 'var(--primary)' }} />
                    <div>
                      <div style={styles.infoLabel}>Delivery Address</div>
                      <div style={styles.infoValue}>{orderDetails.order.delivery_address}</div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div style={styles.selectPrompt}>
                <Clock size={36} style={{ color: 'var(--text-muted)', marginBottom: '12px' }} />
                <p>Select an order from the left to view real-time tracking details.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  page: {
    paddingTop: '40px',
    paddingBottom: '80px',
  },
  title: {
    fontSize: '2rem',
    fontWeight: '800',
    marginBottom: '32px',
  },
  subtitle: {
    fontSize: '1.25rem',
    marginBottom: '16px',
  },
  layoutGrid: {
    display: 'grid',
    gridTemplateColumns: '350px 1fr',
    gap: '32px',
    alignItems: 'start',
  },
  listColumn: {
    display: 'flex',
    flexDirection: 'column',
  },
  ordersList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    maxHeight: 'calc(100vh - 250px)',
    overflowY: 'auto',
    paddingRight: '6px',
  },
  orderCard: {
    padding: '20px',
    cursor: 'pointer',
  },
  orderCardActive: {
    borderColor: 'var(--primary)',
    background: 'rgba(255, 107, 53, 0.05)',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px',
  },
  orderId: {
    fontSize: '0.85rem',
    fontWeight: '700',
    color: 'var(--text-muted)',
  },
  cardRestaurantName: {
    fontSize: '1.15rem',
    fontWeight: '700',
    marginBottom: '12px',
  },
  cardMeta: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '0.85rem',
    color: 'var(--text-sub)',
  },
  metaItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  },
  detailsColumn: {
    position: 'relative',
  },
  detailsCard: {
    padding: '30px',
  },
  detailsHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottom: '1px solid rgba(255,255,255,0.06)',
    paddingBottom: '20px',
    marginBottom: '24px',
  },
  detailsTitle: {
    fontSize: '1.5rem',
    fontWeight: '800',
  },
  refreshBtn: {
    padding: '6px 14px',
    fontSize: '0.82rem',
  },
  timelineWrapper: {
    padding: '20px 0 40px 0',
    borderBottom: '1px solid rgba(255,255,255,0.06)',
    marginBottom: '24px',
  },
  timelineRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    position: 'relative',
  },
  timelineLine: {
    flex: 1,
    height: '4px',
    background: 'rgba(255,255,255,0.06)',
    margin: '0 -24px',
    transform: 'translateY(-16px)',
    zIndex: 1,
  },
  timelineLineCompleted: {
    background: 'var(--primary)',
  },
  stepContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    zIndex: 2,
    flex: '0 0 70px',
  },
  timelineCircle: {
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    background: '#12141c',
    border: '2px solid rgba(255,255,255,0.1)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '0.85rem',
    fontWeight: '700',
    color: 'var(--text-muted)',
    transition: 'all 0.3s ease',
  },
  timelineCircleActive: {
    borderColor: 'var(--primary)',
    color: 'var(--primary)',
    boxShadow: '0 0 12px rgba(255, 107, 53, 0.4)',
    background: 'rgba(255, 107, 53, 0.1)',
  },
  timelineCircleCompleted: {
    borderColor: 'var(--success)',
    color: 'var(--success)',
    background: 'rgba(46, 196, 182, 0.1)',
  },
  stepLabels: {
    marginTop: '10px',
    textAlign: 'center',
    width: '100px',
  },
  stepLabelText: {
    fontSize: '0.82rem',
    fontWeight: '600',
    color: 'var(--text-sub)',
  },
  stepLabelDesc: {
    fontSize: '0.68rem',
    color: 'var(--text-muted)',
    marginTop: '2px',
  },
  cancelledBox: {
    background: 'rgba(231, 29, 54, 0.05)',
    border: '1px solid rgba(231, 29, 54, 0.15)',
    padding: '20px',
    borderRadius: '12px',
    textAlign: 'center',
    color: 'var(--danger)',
    marginBottom: '24px',
  },
  summaryBox: {
    background: 'rgba(255,255,255,0.02)',
    border: '1px solid rgba(255,255,255,0.04)',
    padding: '20px',
    borderRadius: '12px',
    marginBottom: '24px',
  },
  boxTitle: {
    fontSize: '1rem',
    fontWeight: '700',
    marginBottom: '12px',
    fontFamily: "'Outfit', sans-serif",
  },
  itemsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    paddingBottom: '14px',
    borderBottom: '1px solid rgba(255,255,255,0.06)',
  },
  itemRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '0.88rem',
    color: 'var(--text-sub)',
  },
  totalBox: {
    display: 'flex',
    justifyContent: 'space-between',
    fontWeight: '700',
    fontFamily: "'Outfit', sans-serif",
    fontSize: '1.05rem',
    marginTop: '14px',
  },
  deliveryBox: {
    background: 'rgba(255,255,255,0.02)',
    border: '1px solid rgba(255,255,255,0.04)',
    padding: '20px',
    borderRadius: '12px',
  },
  infoRow: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '12px',
  },
  infoLabel: {
    fontSize: '0.78rem',
    color: 'var(--text-muted)',
    textTransform: 'uppercase',
    fontWeight: '700',
  },
  infoValue: {
    fontSize: '0.88rem',
    color: 'var(--text-main)',
    marginTop: '2px',
  },
  selectPrompt: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    height: '350px',
    color: 'var(--text-muted)',
    background: 'rgba(255,255,255,0.02)',
    border: '1px dashed rgba(255,255,255,0.08)',
    borderRadius: '16px',
    padding: '40px',
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    padding: '60px 0',
  },
};

// Handle mobile grid resizing
if (typeof window !== 'undefined') {
  const mediaQuery = window.matchMedia('(max-width: 992px)');
  const handleTabletChange = (e) => {
    if (e.matches) {
      styles.layoutGrid.gridTemplateColumns = '1fr';
    } else {
      styles.layoutGrid.gridTemplateColumns = '350px 1fr';
    }
  };
  mediaQuery.addListener(handleTabletChange);
  handleTabletChange(mediaQuery);
}
