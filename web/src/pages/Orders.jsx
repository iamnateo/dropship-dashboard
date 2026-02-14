import React, { useState, useEffect } from 'react';
import { ordersAPI, cjAPI } from '../services/api';
import toast, { Toaster } from 'react-hot-toast';

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [stats, setStats] = useState({ total_orders: 0, pending: 0, processing: 0, shipped: 0, delivered: 0 });
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [cjProducts, setCjProducts] = useState([]);
  const [cjConnected, setCjConnected] = useState(false);
  const [newOrder, setNewOrder] = useState({
    productId: '',
    quantity: 1,
    customerName: '',
    customerPhone: '',
    customerAddress: ''
  });

  useEffect(() => {
    checkCjConnection();
    loadOrders();
    loadStats();
  }, [pagination.page]);

  const checkCjConnection = async () => {
    try {
      const res = await cjAPI.getStatus();
      setCjConnected(res.data.connected);
    } catch (error) {
      setCjConnected(false);
    }
  };

  const loadOrders = async () => {
    setLoading(true);
    try {
      const res = await ordersAPI.getAll({ page: pagination.page, pageSize: 20 });
      setOrders(res.data.orders || []);
      setPagination(prev => ({
        ...prev,
        totalPages: res.data.totalPages || 1,
        total: res.data.total || 0
      }));
    } catch (error) {
      console.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const res = await ordersAPI.getStats();
      setStats(res.data.stats || { total_orders: 0, pending: 0, processing: 0, shipped: 0, delivered: 0 });
    } catch (error) {
      // Ignore
    }
  };

  const syncOrders = async () => {
    if (!cjConnected) {
      toast.error('Please connect CJ account first');
      return;
    }
    setSyncing(true);
    try {
      const res = await ordersAPI.sync();
      toast.success(`Synced ${res.data.synced} new orders`);
      loadOrders();
      loadStats();
    } catch (error) {
      toast.error('Failed to sync orders');
    } finally {
      setSyncing(false);
    }
  };

  const createOrder = async (e) => {
    e.preventDefault();
    if (!cjConnected) {
      toast.error('Please connect CJ account first');
      return;
    }

    try {
      await ordersAPI.create(newOrder);
      toast.success('Order created successfully!');
      setShowCreateModal(false);
      setNewOrder({
        productId: '',
        quantity: 1,
        customerName: '',
        customerPhone: '',
        customerAddress: ''
      });
      loadOrders();
      loadStats();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to create order');
    }
  };

  const updateStatus = async (orderId, status) => {
    try {
      await ordersAPI.updateStatus(orderId, status);
      toast.success('Order status updated');
      loadOrders();
      loadStats();
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: { class: 'badge-warning', label: 'Pending' },
      processing: { class: 'badge-info', label: 'Processing' },
      shipped: { class: 'badge-info', label: 'Shipped' },
      delivered: { class: 'badge-success', label: 'Delivered' },
      cancelled: { class: 'badge-danger', label: 'Cancelled' }
    };
    const badge = badges[status] || badges.pending;
    return <span className={`badge ${badge.class}`}>{badge.label}</span>;
  };

  return (
    <div>
      <Toaster position="top-right" />
      
      <div className="page-header">
        <h1 className="page-title">Orders</h1>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn btn-secondary" onClick={syncOrders} disabled={syncing}>
            {syncing ? 'Syncing...' : '🔄 Sync from CJ'}
          </button>
          <button className="btn btn-primary" onClick={() => setShowCreateModal(true)} disabled={!cjConnected}>
            + Create Order
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-grid" style={{ marginBottom: '1.5rem' }}>
        <div className="stat-card">
          <div className="stat-label">Total Orders</div>
          <div className="stat-value">{stats.total_orders}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Pending</div>
          <div className="stat-value" style={{ color: stats.pending > 0 ? 'var(--warning)' : 'inherit' }}>{stats.pending}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Processing</div>
          <div className="stat-value">{stats.processing}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Shipped</div>
          <div className="stat-value">{stats.shipped}</div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="card">
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
            <div className="loading-spinner"></div>
          </div>
        ) : orders.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🛒</div>
            <h3>No Orders Yet</h3>
            <p>Orders will appear here when customers purchase from your stores.</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Order #</th>
                  <th>Customer</th>
                  <th>Products</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map(order => (
                  <tr key={order.id}>
                    <td>
                      <strong>{order.order_number || order.cj_order_id || 'N/A'}</strong>
                    </td>
                    <td>
                      <div>{order.customer_name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        {order.customer_phone}
                      </div>
                    </td>
                    <td>
                      {order.products && JSON.parse(order.products).map((p, i) => (
                        <div key={i} style={{ fontSize: '0.875rem' }}>
                          {p.productName || p.productId} x{p.quantity}
                        </div>
                      ))}
                    </td>
                    <td>₱{parseFloat(order.total_amount || 0).toFixed(2)}</td>
                    <td>{getStatusBadge(order.status)}</td>
                    <td>{new Date(order.created_at).toLocaleDateString()}</td>
                    <td>
                      <select
                        className="form-input"
                        value={order.status}
                        onChange={(e) => updateStatus(order.id, e.target.value)}
                        style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                      >
                        <option value="pending">Pending</option>
                        <option value="processing">Processing</option>
                        <option value="shipped">Shipped</option>
                        <option value="delivered">Delivered</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '1.5rem' }}>
            <button
              className="btn btn-secondary"
              disabled={pagination.page === 1}
              onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))}
            >
              Previous
            </button>
            <span style={{ padding: '0.5rem 1rem' }}>
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <button
              className="btn btn-secondary"
              disabled={pagination.page === pagination.totalPages}
              onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* Create Order Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Create Order</h2>
              <button className="modal-close" onClick={() => setShowCreateModal(false)}>×</button>
            </div>
            <form onSubmit={createOrder}>
              <div className="form-group">
                <label className="form-label">Product ID</label>
                <input
                  type="text"
                  className="form-input"
                  value={newOrder.productId}
                  onChange={(e) => setNewOrder(prev => ({ ...prev, productId: e.target.value }))}
                  placeholder="Enter CJ Product ID"
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Quantity</label>
                <input
                  type="number"
                  className="form-input"
                  value={newOrder.quantity}
                  onChange={(e) => setNewOrder(prev => ({ ...prev, quantity: parseInt(e.target.value) }))}
                  min="1"
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Customer Name</label>
                <input
                  type="text"
                  className="form-input"
                  value={newOrder.customerName}
                  onChange={(e) => setNewOrder(prev => ({ ...prev, customerName: e.target.value }))}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Customer Phone</label>
                <input
                  type="text"
                  className="form-input"
                  value={newOrder.customerPhone}
                  onChange={(e) => setNewOrder(prev => ({ ...prev, customerPhone: e.target.value }))}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Customer Address</label>
                <textarea
                  className="form-input"
                  rows="3"
                  value={newOrder.customerAddress}
                  onChange={(e) => setNewOrder(prev => ({ ...prev, customerAddress: e.target.value }))}
                  required
                />
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                Create Order
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Orders;
