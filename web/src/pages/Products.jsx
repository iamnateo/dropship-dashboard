import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { cjAPI, productsAPI } from '../services/api';
import toast, { Toaster } from 'react-hot-toast';

const Products = () => {
  const [activeTab, setActiveTab] = useState('my-products');
  const [cjProducts, setCjProducts] = useState([]);
  const [myProducts, setMyProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [cjConnected, setCjConnected] = useState(false);

  useEffect(() => {
    checkCjConnection();
    if (activeTab === 'my-products') {
      loadMyProducts();
    }
  }, [activeTab, pagination.page]);

  const checkCjConnection = async () => {
    try {
      const res = await cjAPI.getStatus();
      setCjConnected(res.data.connected);
    } catch (error) {
      setCjConnected(false);
    }
  };

  const loadCjProducts = async () => {
    if (!cjConnected) {
      toast.error('Please connect CJ account first');
      return;
    }
    setLoading(true);
    try {
      const res = await cjAPI.getProducts({ page: pagination.page, pageSize: 12, keyword: search });
      setCjProducts(res.data.data?.list || []);
      setPagination(prev => ({
        ...prev,
        totalPages: res.data.data?.totalPage || 1,
        total: res.data.data?.total || 0
      }));
    } catch (error) {
      toast.error('Failed to load CJ products');
    } finally {
      setLoading(false);
    }
  };

  const loadMyProducts = async () => {
    setLoading(true);
    try {
      const res = await productsAPI.getAll({ page: pagination.page, pageSize: 12, search });
      setMyProducts(res.data.products || []);
      setPagination(prev => ({
        ...prev,
        totalPages: res.data.totalPages || 1,
        total: res.data.total || 0
      }));
    } catch (error) {
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const importProduct = async (product) => {
    try {
      await cjAPI.importProduct({
        cjProductId: product.productId,
        name: product.productName,
        description: product.productDescription,
        images: product.productImage ? [product.productImage] : [],
        costPrice: product.productPrice,
        category: product.categoryName,
        weightKg: product.weight
      });
      toast.success('Product imported successfully!');
      setActiveTab('my-products');
      loadMyProducts();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to import product');
    }
  };

  const deleteProduct = async (id) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    try {
      await productsAPI.delete(id);
      toast.success('Product deleted');
      loadMyProducts();
    } catch (error) {
      toast.error('Failed to delete product');
    }
  };

  const applyMarkup = async (percentage) => {
    try {
      const res = await productsAPI.applyMarkup(percentage);
      toast.success(`Updated ${res.data.products?.length || 0} products`);
      loadMyProducts();
    } catch (error) {
      toast.error('Failed to apply markup');
    }
  };

  return (
    <div>
      <Toaster position="top-right" />
      
      <div className="page-header">
        <h1 className="page-title">Products</h1>
        {activeTab === 'my-products' && (
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="btn btn-secondary" onClick={() => applyMarkup(20)}>20% Markup</button>
            <button className="btn btn-primary" onClick={() => applyMarkup(30)}>30% Markup</button>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="tabs">
        <button className={`tab ${activeTab === 'my-products' ? 'active' : ''}`} onClick={() => { setActiveTab('my-products'); setPagination(p => ({ ...p, page: 1 })); }}>
          My Products ({pagination.total})
        </button>
        <button className={`tab ${activeTab === 'cj-catalog' ? 'active' : ''}`} onClick={() => { setActiveTab('cj-catalog'); setPagination(p => ({ ...p, page: 1 })); loadCjProducts(); }}>
          CJ Catalog
        </button>
      </div>

      {/* Search */}
      <div style={{ marginBottom: '1.5rem', display: 'flex', gap: '0.5rem' }}>
        <input
          type="text"
          className="form-input"
          placeholder="Search products..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ maxWidth: '300px' }}
        />
        {activeTab === 'cj-catalog' && (
          <button className="btn btn-primary" onClick={loadCjProducts}>Search</button>
        )}
        {activeTab === 'my-products' && (
          <button className="btn btn-primary" onClick={loadMyProducts}>Search</button>
        )}
      </div>

      {/* Loading */}
      {loading && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
          <div className="loading-spinner"></div>
        </div>
      )}

      {/* CJ Catalog */}
      {!loading && activeTab === 'cj-catalog' && !cjConnected && (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon">🔗</div>
            <h3>Connect CJ Account</h3>
            <p>Please connect your CJDropShipping account to browse their product catalog.</p>
            <Link to="/settings" className="btn btn-primary" style={{ marginTop: '1rem' }}>
              Go to Settings
            </Link>
          </div>
        </div>
      )}

      {/* CJ Products Grid */}
      {!loading && activeTab === 'cj-catalog' && cjConnected && (
        <div className="product-grid">
          {cjProducts.map(product => (
            <div key={product.productId} className="product-card">
              <img
                src={product.productImage || 'https://via.placeholder.com/300x200?text=No+Image'}
                alt={product.productName}
                className="product-image"
                onError={(e) => { e.target.src = 'https://via.placeholder.com/300x200?text=No+Image'; }}
              />
              <div className="product-info">
                <h3 className="product-name">{product.productName}</h3>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                  {product.categoryName}
                </p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span className="product-price">₱{(product.productPrice * 55).toFixed(2)}</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block' }}>
                      Cost: ${product.productPrice}
                    </span>
                  </div>
                </div>
                <button
                  className="btn btn-primary"
                  style={{ width: '100%', marginTop: '0.75rem' }}
                  onClick={() => importProduct(product)}
                >
                  Import to Dashboard
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* My Products Grid */}
      {!loading && activeTab === 'my-products' && (
        <>
          {myProducts.length === 0 ? (
            <div className="card">
              <div className="empty-state">
                <div className="empty-state-icon">📦</div>
                <h3>No Products Yet</h3>
                <p>Import products from CJ catalog to get started.</p>
                <button className="btn btn-primary" style={{ marginTop: '1rem' }} onClick={() => setActiveTab('cj-catalog')}>
                  Browse CJ Catalog
                </button>
              </div>
            </div>
          ) : (
            <div className="product-grid">
              {myProducts.map(product => (
                <div key={product.id} className="product-card">
                  <img
                    src={(product.images && JSON.parse(product.images)[0]) || 'https://via.placeholder.com/300x200?text=No+Image'}
                    alt={product.name}
                    className="product-image"
                    onError={(e) => { e.target.src = 'https://via.placeholder.com/300x200?text=No+Image'; }}
                  />
                  <div className="product-info">
                    <h3 className="product-name">{product.name}</h3>
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                      {product.category}
                    </p>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <span className="product-price">₱{parseFloat(product.selling_price).toFixed(2)}</span>
                        <span className="product-cost" style={{ display: 'block' }}>
                          Cost: ₱{parseFloat(product.cost_price).toFixed(2)} | Markup: {product.markup_percentage}%
                        </span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
                      <Link to={`/products/${product.id}`} className="btn btn-secondary" style={{ flex: 1 }}>
                        Edit
                      </Link>
                      <button className="btn btn-danger" onClick={() => deleteProduct(product.id)}>
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '2rem' }}>
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
  );
};

export default Products;
