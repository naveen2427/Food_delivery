import React, { useState, useEffect } from 'react';
import { Star, MapPin, ArrowLeft, Plus, Minus, MessageSquare, PlusCircle } from 'lucide-react';

export default function RestaurantDetail({ restaurantId, onBack, user, onAddToCart }) {
  const [restaurant, setRestaurant] = useState(null);
  const [menu, setMenu] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Review form states
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [reviewError, setReviewError] = useState('');
  const [reviewSuccess, setReviewSuccess] = useState('');
  const [reviewLoading, setReviewLoading] = useState(false);

  // Menu item quantity selectors
  const [quantities, setQuantities] = useState({});

  useEffect(() => {
    fetchRestaurantDetails();
  }, [restaurantId]);

  const fetchRestaurantDetails = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/restaurants/${restaurantId}`);
      if (!response.ok) throw new Error('Restaurant not found');
      const data = await response.json();
      setRestaurant(data.restaurant);
      setMenu(data.menu || []);
      setReviews(data.reviews || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleQuantityChange = (itemId, change) => {
    setQuantities(prev => {
      const current = prev[itemId] || 1;
      const next = current + change;
      return {
        ...prev,
        [itemId]: next < 1 ? 1 : next
      };
    });
  };

  const submitReview = async (e) => {
    e.preventDefault();
    if (!user) {
      setReviewError('You must be logged in to leave a review.');
      return;
    }
    
    setReviewError('');
    setReviewSuccess('');
    setReviewLoading(true);

    try {
      const response = await fetch(`/api/restaurants/${restaurantId}/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ rating, comment })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit review');
      }

      setReviewSuccess('Thank you! Your review has been saved.');
      setComment('');
      // Reload reviews and restaurant details to update the average rating
      fetchRestaurantDetails();
    } catch (err) {
      setReviewError(err.message);
    } finally {
      setReviewLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-center" style={{ minHeight: '400px' }}>
        <div className="spinner"></div>
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="container" style={{ paddingTop: '40px', textAlign: 'center' }}>
        <h2>Restaurant Not Found</h2>
        <button className="btn btn-secondary" onClick={onBack} style={{ marginTop: '20px' }}>
          <ArrowLeft size={16} /> Back to Restaurants
        </button>
      </div>
    );
  }

  // Group menu by category
  const categories = ['Starter', 'Main Course', 'Dessert', 'Beverage'];
  const groupedMenu = categories.reduce((acc, cat) => {
    acc[cat] = menu.filter(item => item.category === cat);
    return acc;
  }, {});

  return (
    <div className="animate-fade-in" style={{ paddingBottom: '80px' }}>
      {/* Cover Banner */}
      <div style={{ ...styles.banner, backgroundImage: `linear-gradient(rgba(0,0,0,0.4), #0b0c10), url(${restaurant.image_url})` }}>
        <div className="container" style={styles.bannerContent}>
          <button className="btn btn-secondary" style={styles.backBtn} onClick={onBack}>
            <ArrowLeft size={16} /> Back
          </button>
          
          <div style={styles.restaurantInfo}>
            <div className="badge badge-preparing" style={{ marginBottom: '8px' }}>{restaurant.cuisine}</div>
            <h1 style={styles.restaurantName}>{restaurant.name}</h1>
            <p style={styles.restaurantDesc}>{restaurant.description}</p>
            
            <div style={styles.metaRow}>
              <div style={styles.metaItem}>
                <Star size={16} fill="var(--secondary)" color="var(--secondary)" />
                <span style={{ fontWeight: '700' }}>{restaurant.rating > 0 ? restaurant.rating : 'New'}</span>
                <span>({restaurant.review_count} ratings)</span>
              </div>
              <div style={styles.metaDivider}>|</div>
              <div style={styles.metaItem}>
                <MapPin size={16} />
                <span>{restaurant.address}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container" style={styles.mainGrid}>
        {/* Left Side: Menu Items */}
        <div style={styles.menuColumn}>
          <h2 style={styles.sectionHeader}>Gourmet Menu</h2>
          
          {categories.map(cat => {
            const items = groupedMenu[cat];
            if (items.length === 0) return null;
            
            return (
              <div key={cat} style={styles.categorySection}>
                <h3 style={styles.categoryTitle}>{cat}s</h3>
                <div style={styles.menuGrid}>
                  {items.map(item => (
                    <div key={item.id} className="glass-card" style={styles.menuItemCard}>
                      <img 
                        src={item.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500'} 
                        alt={item.name} 
                        style={styles.menuItemImage}
                        onError={(e) => {
                          e.target.src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500';
                        }}
                      />
                      <div style={styles.menuItemDetails}>
                        <div style={styles.menuItemHeader}>
                          <h4 style={styles.menuItemName}>{item.name}</h4>
                          <span style={styles.menuItemPrice}>${item.price.toFixed(2)}</span>
                        </div>
                        <p style={styles.menuItemDesc}>{item.description}</p>
                        
                        {user && user.role === 'customer' ? (
                          <div style={styles.actionRow}>
                            <div style={styles.quantitySelector}>
                              <button 
                                style={styles.qtyBtn} 
                                onClick={() => handleQuantityChange(item.id, -1)}
                              >
                                <Minus size={14} />
                              </button>
                              <span style={styles.qtyText}>{quantities[item.id] || 1}</span>
                              <button 
                                style={styles.qtyBtn} 
                                onClick={() => handleQuantityChange(item.id, 1)}
                              >
                                <Plus size={14} />
                              </button>
                            </div>
                            
                            <button 
                              className="btn btn-primary" 
                              style={styles.addCartBtn}
                              onClick={() => {
                                onAddToCart(item, quantities[item.id] || 1);
                                // Reset quantity back to 1
                                setQuantities(prev => ({ ...prev, [item.id]: 1 }));
                              }}
                            >
                              <PlusCircle size={16} />
                              Add
                            </button>
                          </div>
                        ) : !user ? (
                          <p style={styles.signinTip}>Sign in as customer to order</p>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Side: Reviews & Ratings */}
        <div style={styles.reviewColumn}>
          <div className="glass-card" style={styles.reviewsWrapper}>
            <h3 style={styles.reviewHeader}>
              <MessageSquare size={20} style={{ color: 'var(--primary)' }} />
              Customer Reviews
            </h3>

            {/* Review Input (Customer Only) */}
            {user && user.role === 'customer' && (
              <form onSubmit={submitReview} style={styles.reviewForm}>
                <h4 style={styles.formTitle}>Write a Review</h4>
                {reviewError && <div style={styles.reviewError}>{reviewError}</div>}
                {reviewSuccess && <div style={styles.reviewSuccess}>{reviewSuccess}</div>}
                
                <div className="form-group" style={{ marginBottom: '12px' }}>
                  <label className="form-label">Rating</label>
                  <div style={styles.starsWrapper}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star 
                        key={star} 
                        size={24} 
                        className={`star ${star <= rating ? 'filled' : ''}`}
                        onClick={() => setRating(star)}
                        fill={star <= rating ? 'var(--secondary)' : 'none'}
                        style={{ cursor: 'pointer', marginRight: '4px' }}
                      />
                    ))}
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: '12px' }}>
                  <label className="form-label">Comments</label>
                  <textarea 
                    className="form-input" 
                    rows="3" 
                    placeholder="Share your dining experience..."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    style={styles.textarea}
                    required
                  ></textarea>
                </div>

                <button 
                  type="submit" 
                  className="btn btn-primary" 
                  style={{ width: '100%' }}
                  disabled={reviewLoading}
                >
                  {reviewLoading ? 'Submitting...' : 'Post Review'}
                </button>
              </form>
            )}

            {/* Previous Reviews list */}
            <div style={styles.reviewsList}>
              {reviews.length === 0 ? (
                <div style={styles.noReviews}>No reviews yet. Be the first to review!</div>
              ) : (
                reviews.map(rev => (
                  <div key={rev.id} style={styles.reviewItem}>
                    <div style={styles.reviewItemHeader}>
                      <span style={styles.reviewerName}>{rev.username}</span>
                      <div style={styles.reviewStars}>
                        {[1, 2, 3, 4, 5].map(star => (
                          <Star 
                            key={star} 
                            size={12} 
                            fill={star <= rev.rating ? 'var(--secondary)' : 'none'}
                            color={star <= rev.rating ? 'var(--secondary)' : 'var(--text-muted)'}
                          />
                        ))}
                      </div>
                    </div>
                    <div style={styles.reviewDate}>
                      {new Date(rev.created_at).toLocaleDateString()}
                    </div>
                    <p style={styles.reviewComment}>{rev.comment}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  banner: {
    height: '350px',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    position: 'relative',
    display: 'flex',
    alignItems: 'flex-end',
    paddingBottom: '40px',
    borderBottom: '1px solid var(--border-color)',
  },
  bannerContent: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: '40px',
  },
  backBtn: {
    alignSelf: 'flex-start',
    background: 'rgba(11, 12, 16, 0.7)',
    backdropFilter: 'blur(8px)',
  },
  restaurantInfo: {
    animation: 'fadeIn 0.5s ease',
  },
  restaurantName: {
    fontSize: '3rem',
    fontWeight: '800',
    marginBottom: '8px',
    textShadow: '0 2px 10px rgba(0,0,0,0.5)',
  },
  restaurantDesc: {
    color: 'var(--text-sub)',
    maxWidth: '650px',
    fontSize: '1.05rem',
    marginBottom: '16px',
  },
  metaRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    fontSize: '0.9rem',
    color: 'var(--text-sub)',
  },
  metaItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  metaDivider: {
    color: 'var(--text-muted)',
  },
  mainGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 380px',
    gap: '40px',
    marginTop: '40px',
  },
  menuColumn: {
    display: 'flex',
    flexDirection: 'column',
    gap: '30px',
  },
  sectionHeader: {
    fontSize: '1.75rem',
    borderBottom: '1px solid rgba(255,255,255,0.06)',
    paddingBottom: '12px',
    marginBottom: '10px',
  },
  categorySection: {
    marginBottom: '20px',
  },
  categoryTitle: {
    fontSize: '1.25rem',
    color: 'var(--primary)',
    marginBottom: '16px',
    fontFamily: "'Outfit', sans-serif",
  },
  menuGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  menuItemCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
    padding: '16px',
  },
  menuItemImage: {
    width: '100px',
    height: '100px',
    objectFit: 'cover',
    borderRadius: '12px',
  },
  menuItemDetails: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  menuItemHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  menuItemName: {
    fontSize: '1.1rem',
    fontWeight: '600',
  },
  menuItemPrice: {
    color: 'var(--secondary)',
    fontWeight: '700',
    fontFamily: "'Outfit', sans-serif",
  },
  menuItemDesc: {
    color: 'var(--text-sub)',
    fontSize: '0.85rem',
    lineHeight: '1.4',
  },
  actionRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: '16px',
    marginTop: '8px',
  },
  quantitySelector: {
    display: 'flex',
    alignItems: 'center',
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: '8px',
    padding: '4px',
  },
  qtyBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--text-main)',
    cursor: 'pointer',
    width: '24px',
    height: '24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '4px',
    transition: 'all 0.2s',
  },
  qtyText: {
    width: '28px',
    textAlign: 'center',
    fontSize: '0.9rem',
    fontWeight: '600',
  },
  addCartBtn: {
    padding: '6px 14px',
    fontSize: '0.85rem',
    borderRadius: '8px',
  },
  signinTip: {
    color: 'var(--text-muted)',
    fontSize: '0.78rem',
    textAlign: 'right',
    marginTop: '6px',
  },
  reviewColumn: {
    position: 'relative',
  },
  reviewsWrapper: {
    position: 'sticky',
    top: '100px',
    padding: '24px',
  },
  reviewHeader: {
    fontSize: '1.25rem',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '20px',
    borderBottom: '1px solid rgba(255,255,255,0.06)',
    paddingBottom: '12px',
  },
  reviewForm: {
    background: 'rgba(255,255,255,0.02)',
    border: '1px solid rgba(255,255,255,0.04)',
    padding: '16px',
    borderRadius: '12px',
    marginBottom: '24px',
  },
  formTitle: {
    fontSize: '0.95rem',
    marginBottom: '12px',
    fontFamily: "'Outfit', sans-serif",
  },
  starsWrapper: {
    display: 'flex',
  },
  textarea: {
    fontSize: '0.88rem',
    resize: 'none',
  },
  reviewError: {
    background: 'rgba(231, 29, 54, 0.1)',
    color: 'var(--danger)',
    padding: '8px',
    borderRadius: '6px',
    fontSize: '0.78rem',
    marginBottom: '10px',
    textAlign: 'center',
  },
  reviewSuccess: {
    background: 'rgba(46, 196, 182, 0.1)',
    color: 'var(--success)',
    padding: '8px',
    borderRadius: '6px',
    fontSize: '0.78rem',
    marginBottom: '10px',
    textAlign: 'center',
  },
  reviewsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    maxHeight: '400px',
    overflowY: 'auto',
    paddingRight: '6px',
  },
  noReviews: {
    color: 'var(--text-muted)',
    fontSize: '0.88rem',
    textAlign: 'center',
    padding: '20px 0',
  },
  reviewItem: {
    borderBottom: '1px solid rgba(255,255,255,0.04)',
    paddingBottom: '12px',
  },
  reviewItemHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reviewerName: {
    fontSize: '0.88rem',
    fontWeight: '600',
  },
  reviewStars: {
    display: 'flex',
  },
  reviewDate: {
    fontSize: '0.72rem',
    color: 'var(--text-muted)',
    marginBottom: '6px',
  },
  reviewComment: {
    fontSize: '0.82rem',
    color: 'var(--text-sub)',
    lineHeight: '1.4',
  },
};

// Handle mobile grid resizing
if (typeof window !== 'undefined') {
  const mediaQuery = window.matchMedia('(max-width: 992px)');
  const handleTabletChange = (e) => {
    if (e.matches) {
      styles.mainGrid.gridTemplateColumns = '1fr';
    } else {
      styles.mainGrid.gridTemplateColumns = '1fr 380px';
    }
  };
  mediaQuery.addListener(handleTabletChange);
  handleTabletChange(mediaQuery);
}
