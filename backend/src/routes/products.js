import express from 'express';
import { query } from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Get all products for user
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { page = 1, pageSize = 20, category, search } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(pageSize);

    let whereClause = 'WHERE user_id = $1';
    const params = [req.user.id];
    let paramIndex = 2;

    if (category) {
      whereClause += ` AND category = $${paramIndex}`;
      params.push(category);
      paramIndex++;
    }

    if (search) {
      whereClause += ` AND (name ILIKE $${paramIndex} OR description ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    // Get total count
    const countResult = await query(
      `SELECT COUNT(*) FROM products ${whereClause}`,
      params
    );

    // Get products
    const result = await query(
      `SELECT * FROM products ${whereClause} ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...params, parseInt(pageSize), offset]
    );

    res.json({
      products: result.rows,
      total: parseInt(countResult.rows[0].count),
      page: parseInt(page),
      pageSize: parseInt(pageSize),
      totalPages: Math.ceil(parseInt(countResult.rows[0].count) / parseInt(pageSize))
    });
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ error: 'Failed to get products' });
  }
});

// Get single product
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await query(
      'SELECT * FROM products WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json({ product: result.rows[0] });
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({ error: 'Failed to get product' });
  }
});

// Update product
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { 
      name, 
      description, 
      costPrice, 
      sellingPrice, 
      markupPercentage, 
      stockStatus,
      category,
      images,
      variants
    } = req.body;

    // Check if product exists and belongs to user
    const existing = await query(
      'SELECT * FROM products WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );

    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Calculate new selling price if markup changed
    let newSellingPrice = sellingPrice;
    if (markupPercentage !== undefined && costPrice !== undefined) {
      newSellingPrice = parseFloat(costPrice) * (1 + parseFloat(markupPercentage) / 100);
    }

    const result = await query(
      `UPDATE products SET 
        name = COALESCE($1, name),
        description = COALESCE($2, description),
        cost_price = COALESCE($3, cost_price),
        selling_price = COALESCE($4, selling_price),
        markup_percentage = COALESCE($5, markup_percentage),
        stock_status = COALESCE($6, stock_status),
        category = COALESCE($7, category),
        images = COALESCE($8, images),
        variants = COALESCE($9, variants),
        updated_at = NOW()
       WHERE id = $10 AND user_id = $11
       RETURNING *`,
      [
        name,
        description,
        costPrice,
        newSellingPrice,
        markupPercentage,
        stockStatus,
        category,
        images ? JSON.stringify(images) : null,
        variants ? JSON.stringify(variants) : null,
        req.params.id,
        req.user.id
      ]
    );

    res.json({
      message: 'Product updated successfully',
      product: result.rows[0]
    });
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({ error: 'Failed to update product' });
  }
});

// Delete product
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await query(
      'DELETE FROM products WHERE id = $1 AND user_id = $2 RETURNING id',
      [req.params.id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

// Apply markup to all products
router.post('/apply-markup', authenticateToken, async (req, res) => {
  try {
    const { markupPercentage } = req.body;

    if (markupPercentage === undefined) {
      return res.status(400).json({ error: 'Markup percentage is required' });
    }

    // Update all products with new markup
    const result = await query(
      `UPDATE products SET 
        selling_price = cost_price * (1 + $1 / 100),
        markup_percentage = $1,
        updated_at = NOW()
       WHERE user_id = $2
       RETURNING *`,
      [markupPercentage, req.user.id]
    );

    res.json({
      message: `Updated ${result.rows.length} products with ${markupPercentage}% markup`,
      products: result.rows
    });
  } catch (error) {
    console.error('Apply markup error:', error);
    res.status(500).json({ error: 'Failed to apply markup' });
  }
});

// Bulk delete products
router.post('/bulk-delete', authenticateToken, async (req, res) => {
  try {
    const { productIds } = req.body;

    if (!productIds || !Array.isArray(productIds)) {
      return res.status(400).json({ error: 'Product IDs array is required' });
    }

    const result = await query(
      `DELETE FROM products WHERE id = ANY($1) AND user_id = $2 RETURNING id`,
      [productIds, req.user.id]
    );

    res.json({
      message: `Deleted ${result.rows.length} products`,
      deletedCount: result.rows.length
    });
  } catch (error) {
    console.error('Bulk delete error:', error);
    res.status(500).json({ error: 'Failed to delete products' });
  }
});

// Get product categories
router.get('/meta/categories', authenticateToken, async (req, res) => {
  try {
    const result = await query(
      `SELECT DISTINCT category FROM products WHERE user_id = $1 AND category IS NOT NULL`,
      [req.user.id]
    );

    res.json({ categories: result.rows.map(r => r.category) });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ error: 'Failed to get categories' });
  }
});

export default router;
