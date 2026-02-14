import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { productsAPI } from '../services/api';
import toast, { Toaster } from 'react-hot-toast';

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadProduct();
  }, [id]);

  const loadProduct = async () => {
    try {
      const res = await productsAPI.getOne(id);
      setProduct(res.data.product);
    } catch (error) {
      toast.error('Failed to load product');
      navigate('/products');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await productsAPI.update(id, product);
      toast.success('Product updated successfully!');
    } catch (error) {
      toast.error('Failed to update product');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field, value) => {
    setProduct(prev => ({ ...prev, [field]: value }));
  };

  const calculateSellingPrice = () => {
    if (product && product.cost_price && product.markup_percentage) {
      const selling = parseFloat(product.cost_price) * (1 + parseFloat(product.markup_percentage) / 100);
      setProduct(prev => ({ ...prev, selling_price: selling.toFixed(2) }));
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <div className="loading-spinner"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="card">
        <div className="empty-state">
          <h3>Product not found</h3>
          <button className="btn btn-primary" onClick={() => navigate('/products')}>
            Back to Products
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Toaster position="top-right" />
      
      <div className="page-header">
        <h1 className="page-title">Edit Product</h1>
        <button className="btn btn-secondary" onClick={() => navigate('/products')}>
          ← Back
        </button>
      </div>

      <div className="grid-2">
        {/* Product Info */}
        <div className="card">
          <h2 className="card-title" style={{ marginBottom: '1.5rem' }}>Product Information</h2>
          
          <form onSubmit={handleUpdate}>
            <div className="form-group">
              <label className="form-label">Product Name</label>
              <input
                type="text"
                className="form-input"
                value={product.name || ''}
                onChange={(e) => handleChange('name', e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea
                className="form-input"
                rows="4"
                value={product.description || ''}
                onChange={(e) => handleChange('description', e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Category</label>
              <input
                type="text"
                className="form-input"
                value={product.category || ''}
                onChange={(e) => handleChange('category', e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Stock Status</label>
              <select
                className="form-input"
                value={product.stock_status || 'in_stock'}
                onChange={(e) => handleChange('stock_status', e.target.value)}
              >
                <option value="in_stock">In Stock</option>
                <option value="low_stock">Low Stock</option>
                <option value="out_of_stock">Out of Stock</option>
              </select>
            </div>

            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        </div>

        {/* Pricing */}
        <div className="card">
          <h2 className="card-title" style={{ marginBottom: '1.5rem' }}>Pricing</h2>
          
          <div className="form-group">
            <label className="form-label">Cost Price (USD)</label>
            <input
              type="number"
              step="0.01"
              className="form-input"
              value={product.cost_price || ''}
              onChange={(e) => handleChange('cost_price', e.target.value)}
              onBlur={calculateSellingPrice}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Markup Percentage (%)</label>
            <input
              type="number"
              step="1"
              className="form-input"
              value={product.markup_percentage || ''}
              onChange={(e) => handleChange('markup_percentage', e.target.value)}
              onBlur={calculateSellingPrice}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Selling Price (PHP)</label>
            <input
              type="number"
              step="0.01"
              className="form-input"
              value={product.selling_price || ''}
              onChange={(e) => handleChange('selling_price', e.target.value)}
              style={{ fontSize: '1.25rem', fontWeight: '600', color: 'var(--primary)' }}
            />
          </div>

          <div style={{ padding: '1rem', background: 'var(--background)', borderRadius: '0.5rem', marginTop: '1rem' }}>
            <h3 style={{ fontWeight: 600, marginBottom: '0.5rem' }}>Price Preview</h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              Cost: ${parseFloat(product.cost_price || 0).toFixed(2)} USD
            </p>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              Exchange Rate: ₱55 = $1
            </p>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              Cost in PHP: ₱{(parseFloat(product.cost_price || 0) * 55).toFixed(2)}
            </p>
            <p style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--success)', marginTop: '0.5rem' }}>
              Profit: ₱{((parseFloat(product.selling_price || 0)) - (parseFloat(product.cost_price || 0) * 55)).toFixed(2)}
            </p>
          </div>
        </div>
      </div>

      {/* Product Image */}
      <div className="card" style={{ marginTop: '1.5rem' }}>
        <h2 className="card-title" style={{ marginBottom: '1.5rem' }}>Product Image</h2>
        {product.images && JSON.parse(product.images).length > 0 ? (
          <img
            src={JSON.parse(product.images)[0]}
            alt={product.name}
            style={{ maxWidth: '300px', borderRadius: '0.5rem' }}
            onError={(e) => { e.target.src = 'https://via.placeholder.com/300x200?text=No+Image'; }}
          />
        ) : (
          <p style={{ color: 'var(--text-secondary)' }}>No image available</p>
        )}
      </div>
    </div>
  );
};

export default ProductDetail;
