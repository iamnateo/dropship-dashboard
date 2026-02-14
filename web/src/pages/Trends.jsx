import React, { useState, useEffect } from 'react';
import { trendsAPI } from '../services/api';
import toast, { Toaster } from 'react-hot-toast';

const Trends = () => {
  const [activeSource, setActiveSource] = useState('all');
  const [trends, setTrends] = useState({ google: [], shopee: [], lazada: [] });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadTrends();
  }, []);

  const loadTrends = async () => {
    setLoading(true);
    try {
      const res = await trendsAPI.getAll();
      setTrends({
        google: res.data.google || [],
        shopee: res.data.shopee || [],
        lazada: res.data.lazada || [],
        tiktok: res.data.tiktok || []
      });
    } catch (error) {
      toast.error('Failed to load trends');
    } finally {
      setLoading(false);
    }
  };

  const refreshTrends = async () => {
    setRefreshing(true);
    try {
      await trendsAPI.refresh();
      toast.success('Trends refresh initiated');
      loadTrends();
    } catch (error) {
      toast.error('Failed to refresh trends');
    } finally {
      setRefreshing(false);
    }
  };

  const getSourceIcon = (source) => {
    const icons = {
      google: '🔍',
      shopee: '🛍️',
      lazada: '🛒',
      tiktok: '🎵'
    };
    return icons[source] || '📦';
  };

  const getSourceName = (source) => {
    const names = {
      google: 'Google Trends',
      shopee: 'Shopee PH',
      lazada: 'Lazada PH',
      tiktok: 'TikTok'
    };
    return names[source] || source;
  };

  const displayedTrends = activeSource === 'all' 
    ? [
        ...trends.google.map(t => ({ ...t, displaySource: 'Google' })),
        ...trends.shopee.map(t => ({ ...t, displaySource: 'Shopee' })),
        ...trends.lazada.map(t => ({ ...t, displaySource: 'Lazada' })),
        ...trends.tiktok.map(t => ({ ...t, displaySource: 'TikTok' }))
      ].sort((a, b) => (b.search_volume || 0) - (a.search_volume || 0))
    : trends[activeSource]?.map(t => ({ ...t, displaySource: getSourceName(activeSource) })) || [];

  return (
    <div>
      <Toaster position="top-right" />
      
      <div className="page-header">
        <h1 className="page-title">Market Trends</h1>
        <button className="btn btn-secondary" onClick={refreshTrends} disabled={refreshing}>
          {refreshing ? 'Refreshing...' : '🔄 Refresh'}
        </button>
      </div>

      {/* Source Filter */}
      <div className="tabs">
        <button 
          className={`tab ${activeSource === 'all' ? 'active' : ''}`}
          onClick={() => setActiveSource('all')}
        >
          All Sources
        </button>
        <button 
          className={`tab ${activeSource === 'google' ? 'active' : ''}`}
          onClick={() => setActiveSource('google')}
        >
          🔍 Google
        </button>
        <button 
          className={`tab ${activeSource === 'shopee' ? 'active' : ''}`}
          onClick={() => setActiveSource('shopee')}
        >
          🛍️ Shopee
        </button>
        <button 
          className={`tab ${activeSource === 'lazada' ? 'active' : ''}`}
          onClick={() => setActiveSource('lazada')}
        >
          🛒 Lazada
        </button>
        <button 
          className={`tab ${activeSource === 'tiktok' ? 'active' : ''}`}
          onClick={() => setActiveSource('tiktok')}
        >
          🎵 TikTok
        </button>
      </div>

      {/* Note */}
      <div className="card" style={{ marginBottom: '1.5rem', background: '#eff6ff', borderColor: '#bfdbfe' }}>
        <p style={{ color: '#1e40af', fontSize: '0.875rem' }}>
          💡 <strong>Note:</strong> This data is refreshed periodically. For production use, integrate with Google Trends API and marketplace scrapers for real-time data.
        </p>
      </div>

      {/* Loading */}
      {loading && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
          <div className="loading-spinner"></div>
        </div>
      )}

      {/* Trends Grid */}
      {!loading && (
        <>
          {displayedTrends.length === 0 ? (
            <div className="card">
              <div className="empty-state">
                <div className="empty-state-icon">📈</div>
                <h3>No Trend Data Available</h3>
                <p>Try refreshing to load the latest trends.</p>
              </div>
            </div>
          ) : (
            <div className="grid-3">
              {displayedTrends.map((trend, index) => (
                <div key={index} className="card" style={{ cursor: 'pointer' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                    <span className={`badge ${trend.displaySource === 'Google' ? 'badge-info' : trend.displaySource === 'Shopee' ? 'badge-warning' : trend.displaySource === 'Lazada' ? 'badge-danger' : 'badge-success'}`}>
                      {trend.displaySource}
                    </span>
                    <span style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--primary)' }}>
                      #{index + 1}
                    </span>
                  </div>
                  <h3 style={{ fontWeight: 600, marginBottom: '0.5rem', fontSize: '1rem' }}>
                    {trend.product_name}
                  </h3>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                    <span>📊 {(trend.search_volume || 0).toLocaleString()}</span>
                    <span>📁 {trend.category || 'General'}</span>
                  </div>
                  <div style={{ marginTop: '0.75rem', padding: '0.5rem', background: 'var(--background)', borderRadius: '0.25rem', fontSize: '0.75rem' }}>
                    💰 Price Range: {trend.price_range || 'Varies'}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Top Categories */}
      {!loading && (
        <div className="card" style={{ marginTop: '1.5rem' }}>
          <h2 className="card-title" style={{ marginBottom: '1rem' }}>Top Categories in Philippines</h2>
          <div className="grid-4">
            {[
              { name: 'Electronics', icon: '📱', growth: '+23%' },
              { name: 'Fashion', icon: '👗', growth: '+18%' },
              { name: 'Beauty', icon: '💄', growth: '+31%' },
              { name: 'Home', icon: '🏠', growth: '+15%' },
              { name: 'Health', icon: '💊', growth: '+27%' },
              { name: 'Sports', icon: '⚽', growth: '+12%' },
              { name: 'Baby & Kids', icon: '👶', growth: '+20%' },
              { name: 'Pet Supplies', icon: '🐕', growth: '+25%' }
            ].map((cat, index) => (
              <div key={index} style={{ padding: '1rem', background: 'var(--background)', borderRadius: '0.5rem', textAlign: 'center' }}>
                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{cat.icon}</div>
                <div style={{ fontWeight: 600 }}>{cat.name}</div>
                <div style={{ color: 'var(--success)', fontSize: '0.875rem' }}>{cat.growth}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Trends;
