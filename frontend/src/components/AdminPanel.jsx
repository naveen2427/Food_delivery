import React, { useState, useEffect } from 'react';
import { Shield, Plus, Edit2, Trash2, Check, X, RefreshCw, BarChart2, Users, ShoppingCart, Store, Star } from 'lucide-react';

export default function AdminPanel({ user }) {
  // Common states
  const [loading, setLoading] = useState(true);
  
  // Owner States
  const [restaurants, setRestaurants] = useState([]);
  const [selectedRestId, setSelectedRestId] = useState('');
  const [restaurantDetails, setRestaurantDetails] = useState(null);
  const [menuItems, setMenuItems] = useState([]);
  const [orders, setOrders] = useState([]);
  
  // Menu Item Form States
  const [showItemForm, setShowItemForm] = useState(false);
  const [editingItemId, setEditingItemId] = useState(null);
  const [itemName, setItemName] = useState('');
  const [itemDesc, setItemDesc] = useState('');
  const [itemPrice, setItemPrice] = useState('');
  const [itemCategory, setItemCategory] = useState('Main Course');
  const [itemImageUrl, setItemImageUrl] = useState('');
  
  // Restaurant Details Edit Form
  const [restName, setRestName] = useState('');
  const [restDesc, setRestDesc] = useState('');
  const [restCuisine, setRestCuisine] = useState('');
  const [restAddress, setRestAddress] = useState('');
  const [restImageUrl, setRestImageUrl] = useState('');

  // Super Admin States
  const [metrics, setMetrics] = useState(null);
  const [topRestaurants, setTopRestaurants] = useState([]);
  const [cuisineSales, setCuisineSales] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);
  const [owners, setOwners] = useState([]);
  const [showAddRest, setShowAddRest] = useState(false);
  const [newRestOwnerId, setNewRestOwnerId] = useState('');

  useEffect(() => {
    if (user.role === 'owner') {
      fetchOwnerRestaurants();
    } else if (user.role === 'admin') {
      fetchAdminMetrics();
    }
  }, [user]);

  useEffect(() => {
    if (selectedRestId) {
      fetchRestaurantInfo(selectedRestId);
    }
  }, [selectedRestId]);

  // ==========================================
  // OWNER DASHBOARD METRIC LOGIC
  // ==========================================

  const fetchOwnerRestaurants = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/restaurants');
      const data = await response.json();
      // Filter restaurants owned by this owner
      const owned = data.restaurants.filter(r => r.owner_id === user.id);
      setRestaurants(owned);
      if (owned.length > 0) {
        setSelectedRestId(owned[0].id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchRestaurantInfo = async (restId) => {
    try {
      const response = await fetch(`/api/restaurants/${restId}`);
      const data = await response.json();
      setRestaurantDetails(data.restaurant);
      setMenuItems(data.menu || []);
      
      // Load orders
      const ordResponse = await fetch('/api/orders', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const ordData = await ordResponse.json();
      // Filter orders placed at this restaurant
      const restOrders = ordData.orders.filter(o => o.restaurant_id === parseInt(restId));
      setOrders(restOrders);

      // Prepopulate edit form
      setRestName(data.restaurant.name);
      setRestDesc(data.restaurant.description);
      setRestCuisine(data.restaurant.cuisine);
      setRestAddress(data.restaurant.address);
      setRestImageUrl(data.restaurant.image_url);
    } catch (err) {
      console.error(err);
    }
  };

  const updateRestaurantProfile = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`/api/restaurants/${selectedRestId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          name: restName,
          description: restDesc,
          cuisine: restCuisine,
          address: restAddress,
          image_url: restImageUrl
        })
      });
      if (response.ok) {
        alert('Restaurant details updated successfully!');
        fetchRestaurantInfo(selectedRestId);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveMenuItem = async (e) => {
    e.preventDefault();
    const payload = {
      name: itemName,
      description: itemDesc,
      price: parseFloat(itemPrice),
      category: itemCategory,
      image_url: itemImageUrl || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500'
    };

    const url = editingItemId 
      ? `/api/menu/${editingItemId}`
      : `/api/restaurants/${selectedRestId}/menu`;
    
    const method = editingItemId ? 'PUT' : 'POST';

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(payload)
      });
      if (response.ok) {
        setShowItemForm(false);
        setEditingItemId(null);
        setItemName('');
        setItemDesc('');
        setItemPrice('');
        setItemImageUrl('');
        fetchRestaurantInfo(selectedRestId);
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to save menu item');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleEditItemClick = (item) => {
    setEditingItemId(item.id);
    setItemName(item.name);
    setItemDesc(item.description);
    setItemPrice(item.price.toString());
    setItemCategory(item.category);
    setItemImageUrl(item.image_url);
    setShowItemForm(true);
  };

  const handleDeleteItem = async (itemId) => {
    if (!confirm('Are you sure you want to delete this menu item?')) return;
    try {
      const response = await fetch(`/api/menu/${itemId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (response.ok) {
        fetchRestaurantInfo(selectedRestId);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      const response = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      if (response.ok) {
        fetchRestaurantInfo(selectedRestId);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // ==========================================
  // SUPER ADMIN DASHBOARD LOGIC
  // ==========================================

  const fetchAdminMetrics = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/metrics', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await response.json();
      setMetrics(data.metrics);
      setTopRestaurants(data.top_restaurants || []);
      setCuisineSales(data.sales_by_cuisine || []);
      setRecentOrders(data.recent_orders || []);
      setOwners(data.owners || []);
      if (data.owners && data.owners.length > 0) {
        setNewRestOwnerId(data.owners[0].id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRestaurant = async (e) => {
    e.preventDefault();
    const payload = {
      name: restName,
      description: restDesc,
      cuisine: restCuisine,
      address: restAddress,
      image_url: restImageUrl || 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=500',
      owner_id: parseInt(newRestOwnerId)
    };

    try {
      const response = await fetch('/api/restaurants', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(payload)
      });
      if (response.ok) {
        alert('Restaurant registered successfully!');
        setShowAddRest(false);
        setRestName('');
        setRestDesc('');
        setRestCuisine('');
        setRestAddress('');
        setRestImageUrl('');
        fetchAdminMetrics();
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to create restaurant');
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="flex-center" style={{ minHeight: '400px' }}>
        <div className="spinner"></div>
      </div>
    );
  }

  // ==========================================
  // RENDER OWNER DASHBOARD
  // ==========================================

  if (user.role === 'owner') {
    if (restaurants.length === 0) {
      return (
        <div className="container" style={{ padding: '80px 0', textAlign: 'center' }}>
          <Store size={48} style={{ color: 'var(--text-muted)', marginBottom: '16px' }} />
          <h2>No Restaurants Registered</h2>
          <p style={{ color: 'var(--text-sub)' }}>Please contact the system administrator to assign a restaurant to your account.</p>
        </div>
      );
    }

    return (
      <div className="container animate-fade-in" style={{ padding: '40px 0 80px 0' }}>
        {/* Header selection */}
        <div style={styles.ownerHeader}>
          <div>
            <h1 style={{ fontSize: '2rem' }}>Restaurant Owner Portal</h1>
            <p style={{ color: 'var(--text-sub)', fontSize: '0.9rem' }}>Manage menus, profile details and live orders</p>
          </div>
          
          <div className="form-group" style={{ marginBottom: 0, minWidth: '220px' }}>
            <select 
              className="form-select" 
              value={selectedRestId} 
              onChange={(e) => setSelectedRestId(e.target.value)}
            >
              {restaurants.map(r => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="dashboard-grid">
          {/* Left panel: Quick Details Edit */}
          <div className="glass-card" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '20px', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
              Edit Profile
            </h3>
            
            <form onSubmit={updateRestaurantProfile} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Restaurant Name</label>
                <input type="text" className="form-input" value={restName} onChange={(e) => setRestName(e.target.value)} required />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Cuisine Type</label>
                <input type="text" className="form-input" value={restCuisine} onChange={(e) => setRestCuisine(e.target.value)} required />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Address</label>
                <input type="text" className="form-input" value={restAddress} onChange={(e) => setRestAddress(e.target.value)} required />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Image URL</label>
                <input type="text" className="form-input" value={restImageUrl} onChange={(e) => setRestImageUrl(e.target.value)} />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Description</label>
                <textarea className="form-input" rows="3" value={restDesc} onChange={(e) => setRestDesc(e.target.value)} style={{ resize: 'none' }}></textarea>
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Save Changes</button>
            </form>
          </div>

          {/* Right panel: Menu & Orders */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
            
            {/* 1. Live Orders pipeline */}
            <div className="glass-card" style={{ padding: '24px' }}>
              <h3 style={{ fontSize: '1.25rem', marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Incoming Orders</span>
                <span className="badge badge-preparing" style={{ fontSize: '0.7rem' }}>{orders.length} Active</span>
              </h3>

              {orders.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textAlign: 'center', padding: '20px 0' }}>
                  No active orders for this restaurant.
                </p>
              ) : (
                <div style={styles.ordersContainer}>
                  {orders.map(order => (
                    <div key={order.id} style={styles.ownerOrderRow}>
                      <div style={styles.orderRowMeta}>
                        <div style={{ fontWeight: '700' }}>Order #{order.id}</div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                          Customer: <span style={{ color: '#fff' }}>{order.customer_name}</span>
                        </div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                          Address: {order.delivery_address}
                        </div>
                      </div>

                      <div style={styles.orderRowTotal}>
                        ${order.total_price.toFixed(2)}
                      </div>

                      <div style={styles.orderRowActions}>
                        <span className={`badge ${
                          order.status === 'Pending' ? 'badge-pending' :
                          order.status === 'Preparing' ? 'badge-preparing' :
                          order.status === 'Out for Delivery' ? 'badge-delivery' :
                          order.status === 'Delivered' ? 'badge-delivered' : 'badge-cancelled'
                        }`} style={{ marginRight: '12px' }}>
                          {order.status}
                        </span>

                        {order.status === 'Pending' && (
                          <button className="btn btn-primary" style={styles.actionPipeBtn} onClick={() => updateOrderStatus(order.id, 'Preparing')}>
                            Accept
                          </button>
                        )}
                        {order.status === 'Preparing' && (
                          <button className="btn btn-primary" style={{ ...styles.actionPipeBtn, background: 'linear-gradient(135deg, var(--primary), var(--secondary))' }} onClick={() => updateOrderStatus(order.id, 'Out for Delivery')}>
                            Ship Order
                          </button>
                        )}
                        {order.status === 'Out for Delivery' && (
                          <button className="btn btn-secondary" style={{ ...styles.actionPipeBtn, color: 'var(--success)' }} onClick={() => updateOrderStatus(order.id, 'Delivered')}>
                            <Check size={14} /> Deliver
                          </button>
                        )}
                        {order.status !== 'Delivered' && order.status !== 'Cancelled' && (
                          <button className="btn btn-danger" style={styles.cancelPipeBtn} onClick={() => updateOrderStatus(order.id, 'Cancelled')}>
                            <X size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 2. Menu Items Management */}
            <div className="glass-card" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ fontSize: '1.25rem' }}>Menu Items</h3>
                <button 
                  className="btn btn-primary" 
                  style={{ padding: '6px 12px', fontSize: '0.82rem' }}
                  onClick={() => {
                    setEditingItemId(null);
                    setItemName('');
                    setItemDesc('');
                    setItemPrice('');
                    setItemCategory('Main Course');
                    setItemImageUrl('');
                    setShowItemForm(true);
                  }}
                >
                  <Plus size={16} /> Add Item
                </button>
              </div>

              {/* Menu Item Add/Edit Form Overlay Modal */}
              {showItemForm && (
                <div className="modal-overlay" onClick={() => setShowItemForm(false)}>
                  <div className="modal-content" style={{ padding: '30px' }} onClick={(e) => e.stopPropagation()}>
                    <h3 style={{ fontSize: '1.4rem', marginBottom: '20px' }}>
                      {editingItemId ? 'Edit Menu Item' : 'Add New Menu Item'}
                    </h3>
                    
                    <form onSubmit={handleSaveMenuItem} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">Dish Name</label>
                        <input type="text" className="form-input" placeholder="e.g. Garlic Chicken Alfredo" value={itemName} onChange={(e) => setItemName(e.target.value)} required />
                      </div>
                      <div style={styles.formRow}>
                        <div className="form-group" style={{ marginBottom: 0, flex: 1 }}>
                          <label className="form-label">Price ($)</label>
                          <input type="number" step="0.01" className="form-input" placeholder="12.99" value={itemPrice} onChange={(e) => setItemPrice(e.target.value)} required />
                        </div>
                        <div className="form-group" style={{ marginBottom: 0, flex: 1 }}>
                          <label className="form-label">Category</label>
                          <select className="form-select" value={itemCategory} onChange={(e) => setItemCategory(e.target.value)}>
                            <option value="Starter">Starter</option>
                            <option value="Main Course">Main Course</option>
                            <option value="Dessert">Dessert</option>
                            <option value="Beverage">Beverage</option>
                          </select>
                        </div>
                      </div>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">Image URL</label>
                        <input type="text" className="form-input" placeholder="https://images.unsplash.com/..." value={itemImageUrl} onChange={(e) => setItemImageUrl(e.target.value)} />
                      </div>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">Description</label>
                        <textarea className="form-input" rows="3" placeholder="Explain ingredients and preparation..." value={itemDesc} onChange={(e) => setItemDesc(e.target.value)} style={{ resize: 'none' }}></textarea>
                      </div>

                      <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
                        <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowItemForm(false)}>Cancel</button>
                        <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Save Dish</button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              {/* Menu items listing grid */}
              {menuItems.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textAlign: 'center', padding: '20px 0' }}>
                  No items listed yet. Use the 'Add Item' button to seed your menu.
                </p>
              ) : (
                <div style={styles.menuItemsList}>
                  {menuItems.map(item => (
                    <div key={item.id} style={styles.ownerMenuRow}>
                      <img 
                        src={item.image_url} 
                        alt={item.name} 
                        style={styles.ownerMenuThumb} 
                        onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500'; }}
                      />
                      
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: '600' }}>{item.name}</div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--primary)' }}>{item.category}</div>
                      </div>

                      <div style={{ fontWeight: '700', marginRight: '24px', fontFamily: "'Outfit', sans-serif" }}>
                        ${item.price.toFixed(2)}
                      </div>

                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button className="btn btn-secondary" style={styles.actionIconBtn} onClick={() => handleEditItemClick(item)}>
                          <Edit2 size={14} />
                        </button>
                        <button className="btn btn-danger" style={{ ...styles.actionIconBtn, background: 'rgba(231, 29, 54, 0.1)', color: 'var(--danger)' }} onClick={() => handleDeleteItem(item.id)}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // RENDER SUPER ADMIN DASHBOARD
  // ==========================================

  if (user.role === 'admin') {
    return (
      <div className="container animate-fade-in" style={{ padding: '40px 0 80px 0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
          <div>
            <h1 style={{ fontSize: '2rem' }}>Platform Administrator Dashboard</h1>
            <p style={{ color: 'var(--text-sub)', fontSize: '0.9rem' }}>Global analytics and system configurations</p>
          </div>
          <button className="btn btn-secondary" onClick={fetchAdminMetrics}>
            <RefreshCw size={16} /> Refresh Metrics
          </button>
        </div>

        {/* 1. Metric Cards Row */}
        {metrics && (
          <div style={styles.metricsGrid}>
            <div className="glass-card" style={styles.metricCard}>
              <BarChart2 size={24} style={{ color: 'var(--primary)' }} />
              <div>
                <div style={styles.metricVal}>${metrics.total_sales.toFixed(2)}</div>
                <div style={styles.metricLabel}>Total Revenue</div>
              </div>
            </div>

            <div className="glass-card" style={styles.metricCard}>
              <ShoppingCart size={24} style={{ color: 'var(--secondary)' }} />
              <div>
                <div style={styles.metricVal}>{metrics.total_orders}</div>
                <div style={styles.metricLabel}>Orders Processed</div>
              </div>
            </div>

            <div className="glass-card" style={styles.metricCard}>
              <Users size={24} style={{ color: 'var(--success)' }} />
              <div>
                <div style={styles.metricVal}>{metrics.total_users}</div>
                <div style={styles.metricLabel}>Registered Users</div>
              </div>
            </div>

            <div className="glass-card" style={styles.metricCard}>
              <Store size={24} style={{ color: 'var(--info)' }} />
              <div>
                <div style={styles.metricVal}>{metrics.total_restaurants}</div>
                <div style={styles.metricLabel}>Active Partners</div>
              </div>
            </div>
          </div>
        )}

        {/* 2. Main analytical section */}
        <div style={styles.adminMainGrid}>
          {/* Left panel: Top restaurants + Cuisine Sales */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
            {/* Top Restaurants */}
            <div className="glass-card" style={{ padding: '24px' }}>
              <h3 style={{ fontSize: '1.2rem', marginBottom: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
                Top Rated Restaurants
              </h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {topRestaurants.map((tr, idx) => (
                  <div key={idx} style={styles.topRestRow}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={styles.topRestIndex}>{idx + 1}</div>
                      <div>
                        <div style={{ fontWeight: '600' }}>{tr.name}</div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{tr.cuisine}</div>
                      </div>
                    </div>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Star size={14} fill="var(--secondary)" color="var(--secondary)" />
                      <span style={{ fontWeight: '700', fontSize: '0.9rem' }}>{tr.rating}</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>({tr.review_count} reviews)</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Sales by Cuisine Category */}
            <div className="glass-card" style={{ padding: '24px' }}>
              <h3 style={{ fontSize: '1.2rem', marginBottom: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
                Sales by Cuisine
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {cuisineSales.map((cs, idx) => {
                  const maxVal = cuisineSales[0] ? cuisineSales[0].revenue : 1;
                  const pct = Math.max(10, Math.round((cs.revenue / maxVal) * 100));
                  return (
                    <div key={idx} style={styles.cuisineSalesRow}>
                      <div style={styles.cuisineSalesMeta}>
                        <span style={{ fontWeight: '600' }}>{cs.cuisine}</span>
                        <span style={{ color: 'var(--secondary)', fontWeight: '700' }}>${cs.revenue.toFixed(2)}</span>
                      </div>
                      
                      {/* Bar indicator */}
                      <div style={styles.barTrack}>
                        <div style={{ ...styles.barFill, width: `${pct}%` }}></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right panel: Recent orders and Add Partner Form */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
            
            {/* Create new Restaurant (Partner management) */}
            <div className="glass-card" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ fontSize: '1.2rem' }}>Register New Partner</h3>
                <button className="btn btn-secondary" style={{ padding: '4px 10px', fontSize: '0.75rem' }} onClick={() => setShowAddRest(!showAddRest)}>
                  {showAddRest ? 'Collapse' : 'Expand Form'}
                </button>
              </div>

              {showAddRest && (
                <form onSubmit={handleCreateRestaurant} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Restaurant Name</label>
                    <input type="text" className="form-input" placeholder="e.g. Taco Nacos" value={restName} onChange={(e) => setRestName(e.target.value)} required />
                  </div>

                  <div style={styles.formRow}>
                    <div className="form-group" style={{ marginBottom: 0, flex: 1 }}>
                      <label className="form-label">Cuisine</label>
                      <input type="text" className="form-input" placeholder="Mexican" value={restCuisine} onChange={(e) => setRestCuisine(e.target.value)} required />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0, flex: 1 }}>
                      <label className="form-label">Owner Account</label>
                      <select className="form-select" value={newRestOwnerId} onChange={(e) => setNewRestOwnerId(e.target.value)}>
                        {owners.map(o => (
                          <option key={o.id} value={o.id}>{o.username} ({o.email})</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Address</label>
                    <input type="text" className="form-input" placeholder="456 Spicy Lane" value={restAddress} onChange={(e) => setRestAddress(e.target.value)} required />
                  </div>
                  
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Image URL</label>
                    <input type="text" className="form-input" placeholder="https://..." value={restImageUrl} onChange={(e) => setRestImageUrl(e.target.value)} />
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Description</label>
                    <textarea className="form-input" rows="2" placeholder="Describe the restaurant style..." value={restDesc} onChange={(e) => setRestDesc(e.target.value)} style={{ resize: 'none' }}></textarea>
                  </div>

                  <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Create Partner</button>
                </form>
              )}
            </div>

            {/* Platform Recent Orders list */}
            <div className="glass-card" style={{ padding: '24px' }}>
              <h3 style={{ fontSize: '1.2rem', marginBottom: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
                Recent Platform Orders
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', maxHeight: '420px', overflowY: 'auto' }}>
                {recentOrders.map((o) => (
                  <div key={o.id} style={styles.adminOrderRow}>
                    <div>
                      <div style={{ fontWeight: '600', fontSize: '0.9rem' }}>Order #{o.id}</div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        {o.restaurant_name} &bull; {o.customer_name}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                        {new Date(o.created_at).toLocaleString()}
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: '700', fontFamily: "'Outfit', sans-serif" }}>${o.total_price.toFixed(2)}</div>
                      <span className={`badge ${
                        o.status === 'Pending' ? 'badge-pending' :
                        o.status === 'Preparing' ? 'badge-preparing' :
                        o.status === 'Out for Delivery' ? 'badge-delivery' :
                        o.status === 'Delivered' ? 'badge-delivered' : 'badge-cancelled'
                      }`} style={{ fontSize: '0.62rem', padding: '2px 6px', marginTop: '4px' }}>
                        {o.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>
    );
  }
}

const styles = {
  ownerHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
    borderBottom: '1px solid rgba(255,255,255,0.06)',
    paddingBottom: '20px',
  },
  formRow: {
    display: 'flex',
    gap: '12px',
  },
  ordersContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    maxHeight: '350px',
    overflowY: 'auto',
    paddingRight: '6px',
  },
  ownerOrderRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    background: 'rgba(255,255,255,0.02)',
    border: '1px solid rgba(255,255,255,0.04)',
    padding: '16px',
    borderRadius: '12px',
    gap: '12px',
  },
  orderRowMeta: {
    flex: 1,
  },
  orderRowTotal: {
    fontSize: '1.1rem',
    fontWeight: '700',
    fontFamily: "'Outfit', sans-serif",
    color: 'var(--secondary)',
    minWidth: '70px',
    textAlign: 'right',
  },
  orderRowActions: {
    display: 'flex',
    alignItems: 'center',
  },
  actionPipeBtn: {
    padding: '6px 14px',
    fontSize: '0.82rem',
    borderRadius: '8px',
  },
  cancelPipeBtn: {
    padding: '6px',
    marginLeft: '6px',
    borderRadius: '8px',
  },
  menuItemsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    maxHeight: '400px',
    overflowY: 'auto',
    paddingRight: '6px',
  },
  ownerMenuRow: {
    display: 'flex',
    alignItems: 'center',
    background: 'rgba(255,255,255,0.02)',
    border: '1px solid rgba(255,255,255,0.04)',
    padding: '12px',
    borderRadius: '12px',
  },
  ownerMenuThumb: {
    width: '45px',
    height: '45px',
    objectFit: 'cover',
    borderRadius: '8px',
    marginRight: '16px',
  },
  actionIconBtn: {
    padding: '6px',
    borderRadius: '6px',
  },
  // Admin styles
  metricsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '24px',
    marginBottom: '40px',
  },
  metricCard: {
    padding: '24px',
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
  },
  metricVal: {
    fontSize: '1.6rem',
    fontWeight: '800',
    fontFamily: "'Outfit', sans-serif",
    lineHeight: '1.2',
  },
  metricLabel: {
    fontSize: '0.78rem',
    color: 'var(--text-sub)',
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  adminMainGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '32px',
  },
  topRestRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    background: 'rgba(255,255,255,0.01)',
    border: '1px solid rgba(255,255,255,0.03)',
    padding: '12px 16px',
    borderRadius: '12px',
  },
  topRestIndex: {
    width: '24px',
    height: '24px',
    borderRadius: '50%',
    background: 'var(--primary)',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '0.78rem',
    fontWeight: '800',
  },
  cuisineSalesRow: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  cuisineSalesMeta: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '0.88rem',
  },
  barTrack: {
    height: '8px',
    background: 'rgba(255,255,255,0.05)',
    borderRadius: '4px',
    width: '100%',
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    background: 'linear-gradient(90deg, var(--primary), var(--secondary))',
    borderRadius: '4px',
  },
  adminOrderRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    background: 'rgba(255,255,255,0.02)',
    border: '1px solid rgba(255,255,255,0.04)',
    padding: '12px 16px',
    borderRadius: '12px',
  },
};

// Handle mobile grid resizing
if (typeof window !== 'undefined') {
  const mediaQuery = window.matchMedia('(max-width: 992px)');
  const handleTabletChange = (e) => {
    if (e.matches) {
      styles.adminMainGrid.gridTemplateColumns = '1fr';
    } else {
      styles.adminMainGrid.gridTemplateColumns = '1fr 1fr';
    }
  };
  mediaQuery.addListener(handleTabletChange);
  handleTabletChange(mediaQuery);
}
