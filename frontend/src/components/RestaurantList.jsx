import React, { useState, useEffect } from 'react';
import { Search, Star, MapPin, Loader } from 'lucide-react';

export default function RestaurantList({ setRestaurantId, setPage }) {
  const [restaurants, setRestaurants] = useState([]);
  const [cuisines, setCuisines] = useState([]);
  const [selectedCuisine, setSelectedCuisine] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRestaurants();
  }, [selectedCuisine]);

  const fetchRestaurants = async (search = searchQuery) => {
    setLoading(true);
    let url = '/api/restaurants';
    const params = [];
    if (selectedCuisine) params.push(`cuisine=${encodeURIComponent(selectedCuisine)}`);
    if (search) params.push(`search=${encodeURIComponent(search)}`);
    
    if (params.length > 0) {
      url += `?${params.join('&')}`;
    }

    try {
      const response = await fetch(url);
      const data = await response.json();
      setRestaurants(data.restaurants || []);
      setCuisines(data.cuisines || []);
    } catch (err) {
      console.error('Error fetching restaurants:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchRestaurants(searchQuery);
  };

  const handleSelectRestaurant = (id) => {
    setRestaurantId(id);
    setPage('restaurant-detail');
  };

  return (
    <div className="animate-fade-in" style={{ paddingBottom: '60px' }}>
      {/* Hero Section */}
      <div className="hero">
        <div className="container">
          <h1 className="hero-title">Delicious Food, <span style={{ color: 'var(--primary)' }}>Delivered Fast</span></h1>
          <p className="hero-subtitle">Browse local gourmet restaurants, customize your order, and track delivery in real time.</p>
          
          {/* Search Bar */}
          <form onSubmit={handleSearchSubmit} style={styles.searchForm}>
            <div style={styles.searchWrapper}>
              <Search size={20} style={styles.searchIcon} />
              <input 
                type="text" 
                placeholder="Search restaurants, cuisines, or dishes..." 
                className="form-input" 
                style={styles.searchInput}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button type="submit" className="btn btn-primary" style={styles.searchBtn}>
                Find Food
              </button>
            </div>
          </form>
        </div>
      </div>

      <div className="container">
        {/* Cuisine Filter Badges */}
        <div style={styles.filterContainer}>
          <button 
            style={{
              ...styles.filterBadge,
              ...(selectedCuisine === '' ? styles.filterBadgeActive : {})
            }}
            onClick={() => setSelectedCuisine('')}
          >
            All Cuisines
          </button>
          {cuisines.map((c) => (
            <button 
              key={c}
              style={{
                ...styles.filterBadge,
                ...(selectedCuisine === c ? styles.filterBadgeActive : {})
              }}
              onClick={() => setSelectedCuisine(c)}
            >
              {c}
            </button>
          ))}
        </div>

        {/* Restaurants Grid */}
        {loading ? (
          <div className="flex-center" style={{ minHeight: '300px' }}>
            <div className="spinner"></div>
          </div>
        ) : restaurants.length === 0 ? (
          <div style={styles.emptyState}>
            <h3>No Restaurants Found</h3>
            <p>Try resetting filters or searching for something else!</p>
          </div>
        ) : (
          <div className="grid-responsive">
            {restaurants.map((r) => (
              <div 
                key={r.id} 
                className="glass-card" 
                style={styles.card}
                onClick={() => handleSelectRestaurant(r.id)}
              >
                {/* Cover Image */}
                <div style={styles.imageWrapper}>
                  <img 
                    src={r.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500'} 
                    alt={r.name} 
                    style={styles.cardImage} 
                    onError={(e) => {
                      e.target.src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500';
                    }}
                  />
                  <div style={styles.cuisineBadge}>{r.cuisine}</div>
                </div>

                {/* Card Content */}
                <div style={styles.cardContent}>
                  <div style={styles.cardHeader}>
                    <h3 style={styles.restaurantName}>{r.name}</h3>
                    <div style={styles.ratingBox}>
                      <Star size={16} fill="var(--secondary)" color="var(--secondary)" />
                      <span style={styles.ratingText}>{r.rating > 0 ? r.rating : 'New'}</span>
                      {r.review_count > 0 && (
                        <span style={styles.reviewCount}>({r.review_count})</span>
                      )}
                    </div>
                  </div>
                  
                  <p style={styles.description}>{r.description}</p>
                  
                  <div style={styles.addressBox}>
                    <MapPin size={14} style={{ color: 'var(--text-muted)' }} />
                    <span style={styles.addressText}>{r.address}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  searchForm: {
    maxWidth: '650px',
    margin: '30px auto 0 auto',
  },
  searchWrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    background: 'rgba(15, 17, 26, 0.8)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '16px',
    padding: '6px 6px 6px 18px',
    boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
  },
  searchIcon: {
    color: 'var(--text-muted)',
  },
  searchInput: {
    flex: 1,
    background: 'none',
    border: 'none',
    color: 'var(--text-main)',
    padding: '10px 0',
    fontSize: '1rem',
    outline: 'none',
    boxShadow: 'none',
  },
  searchBtn: {
    borderRadius: '12px',
    padding: '10px 24px',
  },
  filterContainer: {
    display: 'flex',
    gap: '12px',
    overflowX: 'auto',
    paddingBottom: '16px',
    marginBottom: '32px',
    borderBottom: '1px solid rgba(255,255,255,0.06)',
  },
  filterBadge: {
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.06)',
    color: 'var(--text-sub)',
    padding: '8px 18px',
    borderRadius: '20px',
    cursor: 'pointer',
    fontFamily: "'Outfit', sans-serif",
    fontWeight: '600',
    fontSize: '0.88rem',
    whiteSpace: 'nowrap',
    transition: 'all 0.2s',
  },
  filterBadgeActive: {
    background: 'var(--primary)',
    color: '#fff',
    borderColor: 'var(--primary)',
    boxShadow: '0 4px 10px rgba(255, 107, 53, 0.3)',
  },
  card: {
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
  },
  imageWrapper: {
    position: 'relative',
    height: '180px',
    width: '100%',
    overflow: 'hidden',
  },
  cardImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    transition: 'transform 0.5s ease',
  },
  cuisineBadge: {
    position: 'absolute',
    top: '16px',
    right: '16px',
    background: 'rgba(11, 12, 16, 0.8)',
    backdropFilter: 'blur(8px)',
    border: '1px solid rgba(255,255,255,0.1)',
    color: '#fff',
    padding: '4px 12px',
    borderRadius: '12px',
    fontSize: '0.78rem',
    fontWeight: '600',
    fontFamily: "'Outfit', sans-serif",
  },
  cardContent: {
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '10px',
    gap: '8px',
  },
  restaurantName: {
    fontSize: '1.25rem',
    fontWeight: '700',
    lineHeight: '1.2',
  },
  ratingBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    background: 'rgba(255, 255, 255, 0.04)',
    padding: '4px 8px',
    borderRadius: '8px',
    border: '1px solid rgba(255,255,255,0.06)',
  },
  ratingText: {
    fontSize: '0.85rem',
    fontWeight: '700',
    color: 'var(--text-main)',
  },
  reviewCount: {
    fontSize: '0.75rem',
    color: 'var(--text-muted)',
    marginLeft: '2px',
  },
  description: {
    color: 'var(--text-sub)',
    fontSize: '0.88rem',
    lineHeight: '1.5',
    marginBottom: '20px',
    flex: 1,
  },
  addressBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    borderTop: '1px solid rgba(255,255,255,0.06)',
    paddingTop: '12px',
  },
  addressText: {
    fontSize: '0.8rem',
    color: 'var(--text-muted)',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  emptyState: {
    textAlign: 'center',
    padding: '80px 0',
    color: 'var(--text-sub)',
  },
};
