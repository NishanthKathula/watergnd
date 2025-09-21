import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  getMe: () => api.get('/auth/me'),
  updateProfile: (profileData) => api.put('/auth/profile', profileData),
  changePassword: (passwordData) => api.put('/auth/change-password', passwordData),
};

// Stations API
export const stationsAPI = {
  getAll: (params) => api.get('/stations', { params }),
  getById: (id) => api.get(`/stations/${id}`),
  getReadings: (id, params) => api.get(`/stations/${id}/readings`, { params }),
  getTrends: (id, params) => api.get(`/stations/${id}/trends`, { params }),
  create: (stationData) => api.post('/stations', stationData),
  update: (id, stationData) => api.put(`/stations/${id}`, stationData),
  delete: (id) => api.delete(`/stations/${id}`),
};

// Readings API
export const readingsAPI = {
  getAll: (params) => api.get('/readings', { params }),
  getLatest: () => api.get('/readings/latest'),
  getById: (id) => api.get(`/readings/${id}`),
  create: (readingData) => api.post('/readings', readingData),
  createBulk: (readingsData) => api.post('/readings/bulk', readingsData),
  update: (id, readingData) => api.put(`/readings/${id}`, readingData),
  delete: (id) => api.delete(`/readings/${id}`),
  getStats: (params) => api.get('/readings/stats/overview', { params }),
};

// Geolocation API
export const geolocationAPI = {
  getNearestStation: (location) => api.post('/geolocation/nearest-station', location),
  analyzeLocation: (location) => api.post('/geolocation/analyze', location),
  getTrends: (location) => api.post('/geolocation/trends', location),
  getEnvironmentalData: (location) => api.post('/geolocation/environmental-data', location),
};

// Analysis API
export const analysisAPI = {
  getByLocation: (location) => api.post('/analysis/location', location),
  getById: (id) => api.get(`/analysis/${id}`),
  getSimilar: (id, params) => api.get(`/analysis/${id}/similar`, { params }),
  getByArea: (areaData) => api.post('/analysis/area', areaData),
  getTrends: (params) => api.get('/analysis/trends', { params }),
  getStats: (params) => api.get('/analysis/stats/overview', { params }),
};

// Notifications API
export const notificationsAPI = {
  getAll: () => api.get('/notifications'),
  updatePreferences: (preferences) => api.put('/notifications/preferences', preferences),
  subscribe: (subscriptionData) => api.post('/notifications/subscribe', subscriptionData),
  unsubscribe: (stationId) => api.delete(`/notifications/subscribe/${stationId}`),
  sendTest: (testData) => api.post('/notifications/test', testData),
  getHistory: (params) => api.get('/notifications/history', { params }),
  markAsRead: (id) => api.put(`/notifications/${id}/read`),
};

// Reports API
export const reportsAPI = {
  generateLocationReport: (location, format = 'json') => 
    api.post('/reports/location', { ...location, format }),
  generateAreaReport: (areaData, format = 'json') => 
    api.post('/reports/area', { ...areaData, format }),
  generateStationReport: (stationId, params) => 
    api.get(`/reports/station/${stationId}`, { params }),
  generateSummaryReport: (params) => 
    api.get('/reports/summary', { params }),
};

// Utility functions
export const downloadFile = async (url, filename) => {
  try {
    const response = await api.get(url, {
      responseType: 'blob',
    });
    
    const blob = new Blob([response.data]);
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(downloadUrl);
  } catch (error) {
    console.error('Download error:', error);
    throw error;
  }
};

export const uploadFile = async (file, endpoint) => {
  const formData = new FormData();
  formData.append('file', file);
  
  return api.post(endpoint, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

export default api;
