import express from 'express';
import { query } from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';
import * as cjApi from '../services/cjApi.js';

const router = express.Router();

// Get CJ token helper
const getUserCjToken = async (userId) => {
  const result = await query(
    'SELECT access_token FROM cj_credentials WHERE user_id = $1',
    [userId]
  );
  return result.rows.length > 0 ? result.rows[0].access_token : null;
};

// Get all orders
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { page = 1, pageSize = 20, status } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(pageSize);

    let whereClause = 'WHERE user_id = $1';
    const params = [req.user.id];
    let paramIndex = 2;

    if (status) {
      whereClause += ` AND status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    // Get total count
    const countResult = await query(
      `SELECT COUNT(*) FROM orders ${whereClause}`,
      params
    );

    // Get orders
    const result = await query(
      `SELECT * FROM orders ${whereClause} ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...params, parseInt(pageSize), offset]
    );

    res.json({
      orders: result.rows,
      total: parseInt(countResult.rows[0].count),
      page: parseInt(page),
      pageSize: parseInt(pageSize),
      totalPages: Math.ceil(parseInt(countResult.rows[0].count) / parseInt(pageSize))
    });
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ error: 'Failed to get orders' });
  }
});

// Get single order
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await query(
      'SELECT * FROM orders WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json({ order: result.rows[0] });
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({ error: 'Failed to get order' });
  }
});

// Create order on CJ
router.post('/create', authenticateToken, async (req, res) => {
  try {
    const token = await getUserCjToken(req.user.id);
    
    if (!token) {
      return res.status(400).json({ error: 'CJ account not connected' });
    }

    const { 
      productId,
      productName,
      variantId,
      quantity,
      customerName,
      customerPhone,
      customerAddress,
      shippingMethod
    } = req.body;

    if (!productId || !customerName || !customerPhone || !customerAddress) {
      return res.status(400).json({ error: 'Product ID, customer name, phone, and address are required' });
    }

    // Build CJ order data
    const orderData = {
      products: [{
        productId,
        variantId: variantId || null,
        quantity: quantity || 1
      }],
      shippingAddress: {
        fullName: customerName,
        phone: customerPhone,
        address: customerAddress,
        countryCode: 'PH',
        country: 'Philippines'
      },
      shippingMethod: shippingMethod || 'standard',
      payType: 3 // Balance payment
    };

    // Create order on CJ
    const cjResult = await cjApi.createCjOrder(token, orderData);

    if (cjResult.code !== 200) {
      return res.status(400).json({ error: cjResult.message || 'Failed to create CJ order' });
    }

    // Save order to database
    const dbResult = await query(
      `INSERT INTO orders 
       (user_id, cj_order_id, order_number, customer_name, customer_phone, customer_address, products, total_amount, status) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
       RETURNING *`,
      [
        req.user.id,
        cjResult.data?.orderId || null,
        cjResult.data?.orderNumber || null,
        customerName,
        customerPhone,
        customerAddress,
        JSON.stringify([{ productId, productName, quantity }]),
        cjResult.data?.orderAmount || 0,
        'pending'
      ]
    );

    res.status(201).json({
      message: 'Order created successfully',
      order: dbResult.rows[0],
      cjOrder: cjResult.data
    });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ error: 'Failed to create order: ' + error.message });
  }
});

// Sync orders from CJ
router.post('/sync', authenticateToken, async (req, res) => {
  try {
    const token = await getUserCjToken(req.user.id);
    
    if (!token) {
      return res.status(400).json({ error: 'CJ account not connected' });
    }

    // Get orders from CJ
    const cjOrders = await cjApi.getCjOrders(token, 1, 50);

    if (cjOrders.code !== 200 || !cjOrders.data?.list) {
      return res.json({ message: 'No orders found', synced: 0 });
    }

    let synced = 0;

    for (const cjOrder of cjOrders.data.list) {
      // Check if order already exists
      const existing = await query(
        'SELECT id FROM orders WHERE cj_order_id = $1 AND user_id = $2',
        [cjOrder.orderId, req.user.id]
      );

      if (existing.rows.length === 0) {
        // Insert new order
        await query(
          `INSERT INTO orders 
           (user_id, cj_order_id, order_number, customer_name, customer_phone, customer_address, products, total_amount, status, tracking_number) 
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
          [
            req.user.id,
            cjOrder.orderId,
            cjOrder.orderNumber,
            cjOrder.shippingAddress?.fullName || '',
            cjOrder.shippingAddress?.phone || '',
            cjOrder.shippingAddress?.address || '',
            JSON.stringify(cjOrder.products || []),
            cjOrder.orderAmount || 0,
            cjOrder.orderStatus || 'pending',
            cjOrder.trackingNumber || null
          ]
        );
        synced++;
      } else {
        // Update existing order
        await query(
          `UPDATE orders SET 
            status = $1,
            tracking_number = $2,
            updated_at = NOW()
           WHERE cj_order_id = $3 AND user_id = $4`,
          [cjOrder.orderStatus, cjOrder.trackingNumber || null, cjOrder.orderId, req.user.id]
        );
      }
    }

    res.json({
      message: `Synced ${synced} new orders`,
      synced
    });
  } catch (error) {
    console.error('Sync orders error:', error);
    res.status(500).json({ error: 'Failed to sync orders' });
  }
});

// Update order status (manual)
router.put('/:id/status', authenticateToken, async (req, res) => {
  try {
    const { status } = req.body;

    const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const result = await query(
      `UPDATE orders SET status = $1, updated_at = NOW() 
       WHERE id = $2 AND user_id = $3 RETURNING *`,
      [status, req.params.id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json({
      message: 'Order status updated',
      order: result.rows[0]
    });
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({ error: 'Failed to update order status' });
  }
});

// Get order statistics
router.get('/meta/stats', authenticateToken, async (req, res) => {
  try {
    const result = await query(
      `SELECT 
        COUNT(*) as total_orders,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
        COUNT(CASE WHEN status = 'processing' THEN 1 END) as processing,
        COUNT(CASE WHEN status = 'shipped' THEN 1 END) as shipped,
        COUNT(CASE WHEN status = 'delivered' THEN 1 END) as delivered,
        SUM(total_amount) as total_revenue
       FROM orders WHERE user_id = $1`,
      [req.user.id]
    );

    res.json({ stats: result.rows[0] });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: 'Failed to get order stats' });
  }
});

export default router;
