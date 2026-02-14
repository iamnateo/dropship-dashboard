import axios from 'axios';
import { query } from '../config/database.js';

const CJ_API_BASE_URL = 'https://developers.cjdropshipping.com/api2.0/v1';

// Get CJ access token - exchange API key for token
export const getCjAccessToken = async (userId) => {
  try {
    const result = await query(
      'SELECT api_key, access_token, token_expires_at FROM cj_credentials WHERE user_id = $1',
      [userId]
    );

    if (result.rows.length === 0 || !result.rows[0].api_key) {
      return null;
    }

    const cred = result.rows[0];
    
    // Check if we have a valid access token
    if (cred.access_token && cred.token_expires_at && new Date(cred.token_expires_at) > new Date()) {
      return cred.access_token;
    }
    
    // Need to get new access token from API key
    const apiKey = cred.api_key;
    
    // Try to get access token
    const tokenResponse = await axios.post(
      `${CJ_API_BASE_URL}/authentication/getAccessToken`,
      {},
      {
        headers: {
          'CJ-Access-Token': apiKey
        }
      }
    );
    
    console.log('Token response:', tokenResponse.data);
    
    if (tokenResponse.data.code === 200 && tokenResponse.data.data?.accessToken) {
      const accessToken = tokenResponse.data.data.accessToken;
      const expiresIn = tokenResponse.data.data.expiresIn || 86400 * 15; // 15 days
      
      // Save the access token
      await query(
        `UPDATE cj_credentials SET access_token = $1, token_expires_at = NOW() + INTERVAL '1 second' * $2 WHERE user_id = $3`,
        [accessToken, expiresIn, userId]
      );
      
      return accessToken;
    }
    
    console.error('Failed to get token:', tokenResponse.data);
    return null;
    
  } catch (error) {
    console.error('Error getting CJ access token:', error.response?.data || error.message);
    return null;
  }
};

// Save CJ credentials
export const saveCjCredentials = async (userId, apiKey) => {
  // Check if user already has credentials
  const existing = await query(
    'SELECT id FROM cj_credentials WHERE user_id = $1',
    [userId]
  );

  if (existing.rows.length > 0) {
    await query(
      `UPDATE cj_credentials SET api_key = $1, access_token = NULL, token_expires_at = NULL WHERE user_id = $2`,
      [apiKey, userId]
    );
  } else {
    await query(
      `INSERT INTO cj_credentials (user_id, api_key) VALUES ($1, $2)`,
      [userId, apiKey]
    );
  }
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
    const response = await axios.get(`${CJ_API_BASE_URL}/product/query`, {
      headers: {
        'CJ-Access-Token': accessToken
      },
      params: {
        id: productId,
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
    const response = await axios.get(`${CJ_API_BASE_URL}/product/query`, {
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
    const response = await axios.post(`${CJ_API_BASE_URL}/shopping/order/createOrder`, orderData, {
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
    const response = await axios.get(`${CJ_API_BASE_URL}/shopping/order/queryById`, {
      headers: {
        'CJ-Access-Token': accessToken
      },
      params: {
        pageNo: page,
        pageSize
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
    const response = await axios.get(`${CJ_API_BASE_URL}/shopping/pay/getBalance`, {
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
    const response = await axios.get(`${CJ_API_BASE_URL}/logistic/freightCalculate`, {
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
