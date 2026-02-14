import express from 'express';
import { query } from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';
import * as cjApi from '../services/cjApi.js';

const router = express.Router();

// Get CJ access token for user
const getUserCjToken = async (userId) => {
  const result = await query(
    'SELECT access_token, token_expires_at FROM cj_credentials WHERE user_id = $1',
    [userId]
  );
  
  if (result.rows.length === 0) {
    return null;
  }
  
  const cred = result.rows[0];
  
  // Check if token is still valid
  if (cred.token_expires_at && new Date(cred.token_expires_at) > new Date()) {
    return cred.access_token;
  }
  
  return null;
};

// Connect CJ account with API key
router.post('/connect', authenticateToken, async (req, res) => {
  try {
    const { apiKey } = req.body;
    
    if (!apiKey) {
      return res.status(400).json({ error: 'API key is required' });
    }

    // Save the API key (we'll use it directly for CJ API calls)
    await query(
      `INSERT INTO cj_credentials (user_id, access_token, token_expires_at) 
       VALUES ($1, $2, NOW() + INTERVAL '30 days')
       ON CONFLICT (user_id) DO UPDATE SET access_token = $2, token_expires_at = NOW() + INTERVAL '30 days'`,
      [req.user.id, apiKey]
    );

    res.json({ message: 'CJ account connected successfully' });
  } catch (error) {
    console.error('Connect CJ error:', error);
    res.status(500).json({ error: 'Failed to connect CJ account' });
  }
});

// Check CJ connection status
router.get('/status', authenticateToken, async (req, res) => {
  try {
    const token = await getUserCjToken(req.user.id);
    
    if (!token) {
      return res.json({ connected: false });
    }

    // Try to get balance to verify token
    try {
      const balanceData = await cjApi.getCjBalance(token);
      res.json({ 
        connected: true,
        balance: balanceData?.data || null
      });
    } catch (cjError) {
      // Token might be invalid
      await query('DELETE FROM cj_credentials WHERE user_id = $1', [req.user.id]);
      res.json({ connected: false });
    }
  } catch (error) {
    console.error('CJ status error:', error);
    res.status(500).json({ error: 'Failed to check CJ status' });
  }
});

// Fetch products from CJ
router.get('/products', authenticateToken, async (req, res) => {
  try {
    const token = await getUserCjToken(req.user.id);
    
    if (!token) {
      return res.status(400).json({ error: 'CJ account not connected. Please connect your CJ account first.' });
    }

    const { page = 1, pageSize = 20, keyword, categoryId } = req.query;
    
    let productsData;
    if (keyword) {
      productsData = await cjApi.searchCjProducts(token, keyword, parseInt(page), parseInt(pageSize));
    } else {
      productsData = await cjApi.getCjProducts(token, parseInt(page), parseInt(pageSize));
    }

    res.json(productsData);
  } catch (error) {
    console.error('Fetch CJ products error:', error);
    res.status(500).json({ error: 'Failed to fetch products from CJ' });
  }
});

// Get product detail from CJ
router.get('/products/:productId', authenticateToken, async (req, res) => {
  try {
    const token = await getUserCjToken(req.user.id);
    
    if (!token) {
      return res.status(400).json({ error: 'CJ account not connected' });
    }

    const productData = await cjApi.getCjProductDetail(token, req.params.productId);
    res.json(productData);
  } catch (error) {
    console.error('Get CJ product detail error:', error);
    res.status(500).json({ error: 'Failed to get product detail' });
  }
});

// Get CJ categories
router.get('/categories', authenticateToken, async (req, res) => {
  try {
    const token = await getUserCjToken(req.user.id);
    
    if (!token) {
      return res.status(400).json({ error: 'CJ account not connected' });
    }

    const categoriesData = await cjApi.getCjCategories(token);
    res.json(categoriesData);
  } catch (error) {
    console.error('Get CJ categories error:', error);
    res.status(500).json({ error: 'Failed to get categories' });
  }
});

// Import product to dashboard
router.post('/import', authenticateToken, async (req, res) => {
  try {
    const { 
      cjProductId, 
      name, 
      description, 
      images, 
      costPrice, 
      category,
      weightKg,
      variants
    } = req.body;

    if (!cjProductId || !name || !costPrice) {
      return res.status(400).json({ error: 'Product ID, name, and cost price are required' });
    }

    // Calculate selling price with default 30% markup
    const markupPercentage = 30;
    const sellingPrice = parseFloat(costPrice) * (1 + markupPercentage / 100);

    // Save to database
    const result = await query(
      `INSERT INTO products 
       (user_id, cj_product_id, name, description, images, cost_price, selling_price, markup_percentage, category, weight_kg, variants) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) 
       RETURNING *`,
      [
        req.user.id,
        cjProductId,
        name,
        description || null,
        JSON.stringify(images || []),
        costPrice,
        sellingPrice,
        markupPercentage,
        category || null,
        weightKg || null,
        JSON.stringify(variants || [])
      ]
    );

    res.status(201).json({
      message: 'Product imported successfully',
      product: result.rows[0]
    });
  } catch (error) {
    console.error('Import product error:', error);
    res.status(500).json({ error: 'Failed to import product' });
  }
});

// Get CJ balance
router.get('/balance', authenticateToken, async (req, res) => {
  try {
    const token = await getUserCjToken(req.user.id);
    
    if (!token) {
      return res.status(400).json({ error: 'CJ account not connected' });
    }

    const balanceData = await cjApi.getCjBalance(token);
    res.json(balanceData);
  } catch (error) {
    console.error('Get CJ balance error:', error);
    res.status(500).json({ error: 'Failed to get balance' });
  }
});

export default router;
