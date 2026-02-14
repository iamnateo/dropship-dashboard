import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { cjAPI, ordersAPI, productsAPI } from '../services/api';
import toast, { Toaster } from 'react-hot-toast';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalOrders: 0,
    pendingOrders: 0,
    totalRevenue: 0
  });
  const [cjStatus, setCjStatus] = useState({ connected: false, balance: null });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      // Check CJ status
      const cjRes = await cjAPI.getStatus();
      setCjStatus(cjRes.data);

      // Get products count
      const productsRes = await productsAPI.getAll({ pageSize: 1 });
      setStats(prev => ({ ...prev, totalProducts: productsRes.data.total || 0 }));

      // Get orders stats
      try {
        const ordersRes = await ordersAPI.getStats();
        setStats(prev => ({
          ...prev,
          totalOrders: parseInt(ordersRes.data.stats?.total_orders) || 0,
          pendingOrders: parseInt(ordersRes.data.stats?.pending) || 0,
          totalRevenue: parseFloat(ordersRes.data.stats?.total_revenue) || 0
        }));
      } catch (e) {
        // Ignore if no orders yet
      }
    } catch (error) {
      console.error('Dashboard load error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div>
      <Toaster position="top-right" />
      
      <div className="page-header">
        <h1 className="page-title">Dashboard</h1>
        {!cjStatus.connected && (
          <Link to="/settings" className="btn btn-primary">
            ⚠️ Connect CJ Account
          </Link>
        )}
      </div>

      {/* CJ Status Alert */}
      {!cjStatus.connected && (
        <div className="card" style={{ marginBottom: '1.5rem', background: '#fef3c7', borderColor: '#fcd34d' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ fontSize: '2rem' }}>⚠️</div>
            <div>
              <h3 style={{ fontWeight: 600, marginBottom: '0.25rem' }}>CJDropShipping Not Connected</h3>
              <p style={{ color: '#92400e' }}>Connect your CJ account to start importing products and managing orders.</p>
            </div>
            <Link to="/settings" className="btn btn-primary" style={{ marginLeft: 'auto' }}>
              Connect Now
            </Link>
          </div>
        </div>
      )}

      {cjStatus.connected && cjStatus.balance && (
        <div className="card" style={{ marginBottom: '1.5rem', background: '#d1fae5', borderColor: '#6ee7b7' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ fontSize: '2rem' }}>💰</div>
            <div>
              <h3 style={{ fontWeight: 600, marginBottom: '0.25rem' }}>CJ Balance</h3>
              <p style={{ color: '#065f46' }}>Available: ${cjStatus.balance.balance || '0.00'}</p>
            </div>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Total Products</div>
          <div className="stat-value">{stats.totalProducts}</div>
          <Link to="/products" style={{ color: 'var(--primary)', fontSize: '0.875rem' }}>
            View Products →
          </Link>
        </div>
        
        <div className="stat-card">
          <div className="stat-label">Total Orders</div>
          <div className="stat-value">{stats.totalOrders}</div>
          <Link to="/orders" style={{ color: 'var(--primary)', fontSize: '0.875rem' }}>
            View Orders →
          </Link>
        </div>
        
        <div className="stat-card">
          <div className="stat-label">Pending Orders</div>
          <div className="stat-value" style={{ color: stats.pendingOrders > 0 ? 'var(--warning)' : 'inherit' }}>
            {stats.pendingOrders}
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-label">Total Revenue</div>
          <div className="stat-value">₱{stats.totalRevenue.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</div>
        </div>
      </div>

      {/* Quick Actions */}
      <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem' }}>Quick Actions</h2>
      <div className="grid-3">
        <Link to="/products" className="card" style={{ textDecoration: 'none', cursor: 'pointer' }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📦</div>
          <h3 style={{ fontWeight: 600, marginBottom: '0.5rem' }}>Import Products</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            Browse CJ catalog and import products to your dashboard
          </p>
        </Link>
        
        <Link to="/orders" className="card" style={{ textDecoration: 'none', cursor: 'pointer' }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🛒</div>
          <h3 style={{ fontWeight: 600, marginBottom: '0.5rem' }}>Manage Orders</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            View and process orders from your customers
          </p>
        </Link>
        
        <Link to="/trends" className="card" style={{ textDecoration: 'none', cursor: 'pointer' }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📈</div>
          <h3 style={{ fontWeight: 600, marginBottom: '0.5rem' }}>Market Trends</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            Discover trending products in the Philippine market
          </p>
        </Link>
      </div>
    </div>
  );
};

export default Dashboard;
