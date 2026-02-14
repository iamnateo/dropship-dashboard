import axios from 'axios';

// Get API URL - ensure it ends with /api
const getApiUrl = () => {
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl) {
    return envUrl.endsWith('/api') ? envUrl : `${envUrl}/api`;
  }
  return 'http://localhost:3000/api';
};

const API_URL = getApiUrl();

console.log('API URL:', API_URL);

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
  updatePassword: (data) => api.put('/auth/password', data)
};

// CJ API
export const cjAPI = {
  connect: (apiKey) => api.post('/cj/connect', { apiKey }),
  getStatus: () => api.get('/cj/status'),
  getProducts: (params) => api.get('/cj/products', { params }),
  getProductDetail: (productId) => api.get(`/cj/products/${productId}`),
  getCategories: () => api.get('/cj/categories'),
  importProduct: (data) => api.post('/cj/import', data),
  getBalance: () => api.get('/cj/balance')
};

// Products API
export const productsAPI = {
  getAll: (params) => api.get('/products', { params }),
  getOne: (id) => api.get(`/products/${id}`),
  update: (id, data) => api.put(`/products/${id}`, data),
  delete: (id) => api.delete(`/products/${id}`),
  applyMarkup: (markupPercentage) => api.post('/products/apply-markup', { markupPercentage }),
  bulkDelete: (ids) => api.post('/products/bulk-delete', { productIds: ids }),
  getCategories: () => api.get('/products/meta/categories')
};

// Orders API
export const ordersAPI = {
  getAll: (params) => api.get('/orders', { params }),
  getOne: (id) => api.get(`/orders/${id}`),
  create: (data) => api.post('/orders/create', data),
  sync: () => api.post('/orders/sync'),
  updateStatus: (id, status) => api.put(`/orders/${id}/status`, { status }),
  getStats: () => api.get('/orders/meta/stats')
};

// Trends API
export const trendsAPI = {
  getGoogle: (params) => api.get('/trends/google', { params }),
  getShopee: (params) => api.get('/trends/shopee', { params }),
  getLazada: (params) => api.get('/trends/lazada', { params }),
  getTikTok: (params) => api.get('/trends/tiktok', { params }),
  getAll: (params) => api.get('/trends/all', { params }),
  refresh: () => api.post('/trends/refresh')
};

export default api;
