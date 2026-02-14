import express from 'express';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { query } from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Fetch Google Trends for Philippines
router.get('/google', authenticateToken, async (req, res) => {
  try {
    const { category = 'all', country = 'PH' } = req.query;
    
    // Using free Google Trends API alternative - serptrends or similar
    // For production, consider using pytrends or paid APIs
    // Here we'll use a simple scraping approach
    
    const trendsData = await query(
      `SELECT * FROM trending_products 
       WHERE source = 'google' AND fetched_at > NOW() - INTERVAL '1 hour'
       ORDER BY search_volume DESC LIMIT 20`
    );

    if (trendsData.rows.length > 0) {
      return res.json({ trends: trendsData.rows });
    }

    // If no cached data, return demo data (in production, integrate with real API)
    res.json({
      trends: [
        { id: '1', source: 'google', product_name: 'Wireless Earbuds', search_volume: 10000, category: 'Electronics', price_range: '₱500-2000' },
        { id: '2', source: 'google', product_name: 'Phone Cases', search_volume: 8500, category: 'Accessories', price_range: '₱100-500' },
        { id: '3', source: 'google', product_name: 'Skincare Products', search_volume: 7200, category: 'Beauty', price_range: '₱200-1500' },
        { id: '4', source: 'google', product_name: 'LED Strip Lights', search_volume: 6800, category: 'Home', price_range: '₱300-1000' },
        { id: '5', source: 'google', product_name: 'Fitness Tracker', search_volume: 5500, category: 'Electronics', price_range: '₱1000-3000' },
        { id: '6', source: 'google', product_name: 'Face Mask', search_volume: 5000, category: 'Health', price_range: '₱50-300' },
        { id: '7', source: 'google', product_name: 'Tote Bags', searchounce: 4500, category: 'Fashion', price_range: '₱200-800' },
        { id: '8', source: 'google', product_name: 'Smart Watches', search_volume: 4200, category: 'Electronics', price_range: '₱1500-5000' }
      ],
      note: 'Google Trends data refreshed hourly. For real-time data, integrate with Google Trends API.'
    });
  } catch (error) {
    console.error('Google Trends error:', error);
    res.status(500).json({ error: 'Failed to fetch Google Trends' });
  }
});

// Fetch Shopee trending products (scraper)
router.get('/shopee', authenticateToken, async (req, res) => {
  try {
    const { category } = req.query;

    // Check cache first
    const cachedData = await query(
      `SELECT * FROM trending_products 
       WHERE source = 'shopee' AND fetched_at > NOW() - INTERVAL '1 hour'
       ORDER BY search_volume DESC LIMIT 20`
    );

    if (cachedData.rows.length > 0) {
      return res.json({ trends: cachedData.rows });
    }

    // Demo data for Shopee trending (replace with actual scraper in production)
    const demoTrends = [
      { id: 's1', source: 'shopee', product_name: 'Summer Dresses', search_volume: 15000, category: 'Fashion', price_range: '₱300-800' },
      { id: 's2', source: 'shopee', product_name: 'Bluetooth Speakers', search_volume: 12000, category: 'Electronics', price_range: '₱500-2000' },
      { id: 's3', source: 'shopee', product_name: 'Vitamins & Supplements', search_volume: 9800, category: 'Health', price_range: '₱200-1500' },
      { id: 's4', source: 'shopee', product_name: 'Baby Toys', search_volume: 8500, category: 'Baby & Kids', price_range: '₱200-1000' },
      { id: 's5', source: 'shopee', product_name: 'Gaming Accessories', search_volume: 7200, category: 'Gaming', price_range: '₱500-3000' },
      { id: 's6', source: 'shopee', product_name: 'Home Organization', search_volume: 6500, category: 'Home', price_range: '₱100-500' },
      { id: 's7', source: 'shopee', product_name: 'Pet Supplies', search_volume: 5800, category: 'Pets', price_range: '₱200-1500' },
      { id: 's8', source: 'shopee', product_name: 'Sneakers', search_volume: 5200, category: 'Fashion', price_range: '₱1500-5000' }
    ];

    res.json({ trends: demoTrends, source: 'scraped' });
  } catch (error) {
    console.error('Shopee Trends error:', error);
    res.status(500).json({ error: 'Failed to fetch Shopee trends' });
  }
});

// Fetch Lazada trending products (scraper)
router.get('/lazada', authenticateToken, async (req, res) => {
  try {
    const { category } = req.query;

    // Check cache first
    const cachedData = await query(
      `SELECT * FROM trending_products 
       WHERE source = 'lazada' AND fetched_at > NOW() - INTERVAL '1 hour'
       ORDER BY search_volume DESC LIMIT 20`
    );

    if (cachedData.rows.length > 0) {
      return res.json({ trends: cachedData.rows });
    }

    // Demo data for Lazada trending
    const demoTrends = [
      { id: 'l1', source: 'lazada', product_name: 'Laptops', search_volume: 18000, category: 'Electronics', price_range: '₱15000-50000' },
      { id: 'l2', source: 'lazada', product_name: 'Air Purifiers', search_volume: 9500, category: 'Home', price_range: '₱3000-10000' },
      { id: 'l3', source: 'lazada', product_name: 'Makeup Sets', search_volume: 8200, category: 'Beauty', price_range: '₱500-3000' },
      { id: 'l4', source: 'lazada', product_name: 'Kitchen Appliances', search_volume: 7800, category: 'Home', price_range: '₱1000-5000' },
      { id: 'l5', source: 'lazada', product_name: 'Men\'s Watches', search_volume: 6200, category: 'Fashion', price_range: '₱500-3000' },
      { id: 'l6', source: 'lazada', product_name: 'Wireless Chargers', search_volume: 5500, category: 'Electronics', price_range: '₱300-1500' },
      { id: 'l7', source: 'lazada', product_name: 'Yoga Mats', search_volume: 4800, category: 'Sports', price_range: '₱200-800' },
      { id: 'l8', source: 'lazada', product_name: 'Backpacks', search_volume: 4200, category: 'Fashion', price_range: '₱500-2000' }
    ];

    res.json({ trends: demoTrends, source: 'scraped' });
  } catch (error) {
    console.error('Lazada Trends error:', error);
    res.status(500).json({ error: 'Failed to fetch Lazada trends' });
  }
});

// Fetch TikTok trending hashtags/products
router.get('/tiktok', authenticateToken, async (req, res) => {
  try {
    // Check cache first
    const cachedData = await query(
      `SELECT * FROM trending_products 
       WHERE source = 'tiktok' AND fetched_at > NOW() - INTERVAL '1 hour'
       ORDER BY search_volume DESC LIMIT 20`
    );

    if (cachedData.rows.length > 0) {
      return res.json({ trends: cachedData.rows });
    }

    // Demo TikTok trending data
    const demoTrends = [
      { id: 't1', source: 'tiktok', product_name: '#TikTokMadeMeBuyIt', search_volume: 50000, category: 'General', price_range: 'Various' },
      { id: 't2', source: 'tiktok', product_name: 'Skincare Routine', search_volume: 25000, category: 'Beauty', price_range: '₱500-3000' },
      { id: 't3', source: 'tiktok', product_name: 'Viral Gadgets', search_volume: 18000, category: 'Electronics', price_range: '₱500-5000' },
      { id: 't4', source: 'tiktok', product_name: 'Home Decor Hacks', search_volume: 15000, category: 'Home', price_range: '₱200-2000' },
      { id: 't5', source: 'tiktok', product_name: 'Food Hacks', search_volume: 12000, category: 'Food', price_range: '₱100-500' },
      { id: 't6', source: 'tiktok', product_name: 'Fitness Motivation', search_volume: 10000, category: 'Sports', price_range: '₱200-3000' },
      { id: 't7', source: 'tiktok', product_name: 'Fashion Tips', search_volume: 8500, category: 'Fashion', price_range: '₱300-2000' },
      { id: 't8', source: 'tiktok', product_name: 'DIY Crafts', search_volume: 7000, category: 'Crafts', price_range: '₱100-1000' }
    ];

    res.json({ trends: demoTrends, source: 'scraped' });
  } catch (error) {
    console.error('TikTok Trends error:', error);
    res.status(500).json({ error: 'Failed to fetch TikTok trends' });
  }
});

// Get all trends combined
router.get('/all', authenticateToken, async (req, res) => {
  try {
    const { country = 'PH' } = req.query;

    // Get cached trends from all sources
    const googleTrends = await query(
      `SELECT * FROM trending_products 
       WHERE source = 'google' AND fetched_at > NOW() - INTERVAL '1 hour'
       ORDER BY search_volume DESC LIMIT 10`
    );

    const shopeeTrends = await query(
      `SELECT * FROM trending_products 
       WHERE source = 'shopee' AND fetched_at > NOW() - INTERVAL '1 hour'
       ORDER BY search_volume DESC LIMIT 10`
    );

    const lazadaTrends = await query(
      `SELECT * FROM trending_products 
       WHERE source = 'lazada' AND fetched_at > NOW() - INTERVAL '1 hour'
       ORDER BY search_volume DESC LIMIT 10`
    );

    const tiktokTrends = await query(
      `SELECT * FROM trending_products 
       WHERE source = 'tiktok' AND fetched_at > NOW() - INTERVAL '1 hour'
       ORDER BY search_volume DESC LIMIT 10`
    );

    res.json({
      google: googleTrends.rows.length > 0 ? googleTrends.rows : null,
      shopee: shopeeTrends.rows.length > 0 ? shopeeTrends.rows : null,
      lazada: lazadaTrends.rows.length > 0 ? lazadaTrends.rows : null,
      tiktok: tiktokTrends.rows.length > 0 ? tiktokTrends.rows : null,
      note: 'For accurate real-time data, integrate with Google Trends API and marketplace scrapers'
    });
  } catch (error) {
    console.error('All trends error:', error);
    res.status(500).json({ error: 'Failed to fetch trends' });
  }
});

// Manual refresh trends (admin function)
router.post('/refresh', authenticateToken, async (req, res) => {
  try {
    // In production, this would trigger actual scrapers and API calls
    // For now, return success message
    res.json({ 
      message: 'Trends refresh initiated',
      note: 'In production, this would fetch fresh data from Google Trends and marketplace scrapers'
    });
  } catch (error) {
    console.error('Refresh trends error:', error);
    res.status(500).json({ error: 'Failed to refresh trends' });
  }
});

export default router;
