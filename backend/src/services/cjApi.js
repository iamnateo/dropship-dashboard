import axios from 'axios';
import { query } from '../config/database.js';

const CJ_API_BASE_URL = process.env.CJ_API_BASE_URL || 'https://developers.cjdropshipping.com/api2.0/v1';

// Get CJ access token for user
export const getCjAccessToken = async (userId) => {
  const result = await query(
    'SELECT access_token, token_expires_at FROM cj_credentials WHERE user_id = $1',
    [userId]
  );

  if (result.rows.length === 0) {
    return null;
  }

  const cred = result.rows[0];
  
  // Check if token is still valid
  if (cred.token_expires_at && new Date(cred.token_expises_at) > new Date()) {
    return cred.access_token;
  }

  return null;
};

// Save CJ credentials
export const saveCjCredentials = async (userId, accessToken, expiresIn) => {
  const expiresAt = new Date(Date.now() + expiresIn * 1000);
  
  await query(
    `INSERT INTO cj_credentials (user_id, access_token, token_expires_at) 
     VALUES ($1, $2, $3) 
     ON CONFLICT (user_id) DO UPDATE SET access_token = $2, token_expires_at = $3`,
    [userId, accessToken, expiresAt]
  );
};

// Get CJ products with pagination
export const getCjProducts = async (accessToken, page = 1, pageSize = 20) => {
  try {
    const response = await axios.get(`${CJ_API_BASE_URL}/product/list`, {
      headers: {
        'CJ-Access-Token': accessToken
      },
      params: {
        page,
        pageSize,
        lang: 'en'
      }
    });
    return response.data;
  } catch (error) {
    console.error('CJ API Error:', error.response?.data || error.message);
    throw error;
  }
};

// Get CJ product details
export const getCjProductDetail = async (accessToken, productId) => {
  try {
    const response = await axios.get(`${CJ_API_BASE_URL}/product/getProductDetail`, {
      headers: {
        'CJ-Access-Token': accessToken
      },
      params: {
        productId,
        lang: 'en'
      }
    });
    return response.data;
  } catch (error) {
    console.error('CJ API Error:', error.response?.data || error.message);
    throw error;
  }
};

// Get CJ categories
export const getCjCategories = async (accessToken) => {
  try {
    const response = await axios.get(`${CJ_API_BASE_URL}/product/getCategory`, {
      headers: {
        'CJ-Access-Token': accessToken
      }
    });
    return response.data;
  } catch (error) {
    console.error('CJ API Error:', error.response?.data || error.message);
    throw error;
  }
};

// Search CJ products
export const searchCjProducts = async (accessToken, keyword, page = 1, pageSize = 20) => {
  try {
    const response = await axios.get(`${CJ_API_BASE_URL}/product/list`, {
      headers: {
        'CJ-Access-Token': accessToken
      },
      params: {
        keyword,
        page,
        pageSize,
        lang: 'en'
      }
    });
    return response.data;
  } catch (error) {
    console.error('CJ API Error:', error.response?.data || error.message);
    throw error;
  }
};

// Create order on CJ
export const createCjOrder = async (accessToken, orderData) => {
  try {
    const response = await axios.post(`${CJ_API_BASE_URL}/shopping/order/createOrderV2`, orderData, {
      headers: {
        'CJ-Access-Token': accessToken,
        'Content-Type': 'application/json'
      }
    });
    return response.data;
  } catch (error) {
    console.error('CJ API Error:', error.response?.data || error.message);
    throw error;
  }
};

// Get CJ orders
export const getCjOrders = async (accessToken, page = 1, pageSize = 20) => {
  try {
    const response = await axios.get(`${CJ_API_BASE_URL}/shopping/order/list`, {
      headers: {
        'CJ-Access-Token': accessToken
      },
      params: {
        page,
        pageSize
      }
    });
    return response.data;
  } catch (error) {
    console.error('CJ API Error:', error.response?.data || error.message);
    throw error;
  }
};

// Get CJ order detail
export const getCjOrderDetail = async (accessToken, orderId) => {
  try {
    const response = await axios.get(`${CJ_API_BASE_URL}/shopping/order/getOrder`, {
      headers: {
        'CJ-Access-Token': accessToken
      },
      params: {
        orderId
      }
    });
    return response.data;
  } catch (error) {
    console.error('CJ API Error:', error.response?.data || error.message);
    throw error;
  }
};

// Get CJ balance
export const getCjBalance = async (accessToken) => {
  try {
    const response = await axios.get(`${CJ_API_BASE_URL}/shopping/payment/getBalance`, {
      headers: {
        'CJ-Access-Token': accessToken
      }
    });
    return response.data;
  } catch (error) {
    console.error('CJ API Error:', error.response?.data || error.message);
    throw error;
  }
};

// Get shipping rates
export const getShippingRates = async (accessToken, productId, country) => {
  try {
    const response = await axios.get(`${CJ_API_BASE_URL}/logistic/freight`, {
      headers: {
        'CJ-Access-Token': accessToken
      },
      params: {
        productId,
        country,
        productNum: 1
      }
    });
    return response.data;
  } catch (error) {
    console.error('CJ API Error:', error.response?.data || error.message);
    throw error;
  }
};
