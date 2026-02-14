import axios from 'axios';

// Change this to your backend URL when deployed
const API_URL = 'http://YOUR_BACKEND_URL/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

api.interceptors.request.use((config) => {
  const token = global.token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data)
};

export const productsAPI = {
  getAll: (params) => api.get('/products', { params })
};

export const ordersAPI = {
  getAll: (params) => api.get('/orders', { params }),
  getStats: () => api.get('/orders/meta/stats')
};

export const trendsAPI = {
  getAll: () => api.get('/trends/all')
};

export const cjAPI = {
  getStatus: () => api.get('/cj/status')
};

export default api;
