import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

export const query = async (text, params) => {
  const client = await pool.connect();
  try {
    const result = await client.query(text, params);
    return result;
  } finally {
    client.release();
  }
};

export const initDatabase = async () => {
  const createTables = `
    -- Users table
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      full_name VARCHAR(255),
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );

    -- CJ Credentials table
    CREATE TABLE IF NOT EXISTS cj_credentials (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID REFERENCES users(id) ON DELETE CASCADE,
      access_token TEXT,
      token_expires_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT NOW()
    );

    -- Products table
    CREATE TABLE IF NOT EXISTS products (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID REFERENCES users(id) ON DELETE CASCADE,
      cj_product_id VARCHAR(255),
      name VARCHAR(500),
      description TEXT,
      images JSONB,
      cost_price DECIMAL(10,2),
      selling_price DECIMAL(10,2),
      markup_percentage DECIMAL(5,2) DEFAULT 30,
      stock_status VARCHAR(20) DEFAULT 'in_stock',
      category VARCHAR(100),
      weight_kg DECIMAL(6,2),
      variants JSONB,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );

    -- Orders table
    CREATE TABLE IF NOT EXISTS orders (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID REFERENCES users(id) ON DELETE CASCADE,
      cj_order_id VARCHAR(100),
      order_number VARCHAR(100),
      customer_name VARCHAR(255),
      customer_address TEXT,
      customer_phone VARCHAR(50),
      products JSONB,
      total_amount DECIMAL(10,2),
      status VARCHAR(50) DEFAULT 'pending',
      tracking_number VARCHAR(100),
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );

    -- Trending products table
    CREATE TABLE IF NOT EXISTS trending_products (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      source VARCHAR(50),
      product_name VARCHAR(500),
      search_volume INTEGER,
      category VARCHAR(100),
      price_range VARCHAR(50),
      fetched_at TIMESTAMP DEFAULT NOW()
    );
  `;

  try {
    await query(createTables);
    console.log('Database tables initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
  }
};

export default pool;
