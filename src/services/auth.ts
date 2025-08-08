import axios from 'axios';

// Determine the API URL based on the current domain
let API_URL = 'http://13.221.221.48'; // Default for production

if (typeof window !== 'undefined') {
  const currentDomain = window.location.hostname;
  const currentPort = window.location.port;
  
  if (currentDomain === 'localhost' || currentDomain === '127.0.0.1') {
    // Use localhost:8000 for local development
    API_URL = 'http://localhost:8000';
  } else if (currentDomain === 'app.ditsxpress.com') {
    // Use the same domain for production to avoid CORS issues
    API_URL = window.location.protocol + '//' + currentDomain;
  }
  // For other domains, keep the default (13.221.221.48)
  
  // Debug logging
  console.log('API URL Configuration:', {
    currentDomain,
    currentPort,
    protocol: window.location.protocol,
    resolvedAPI_URL: API_URL
  });
}

// Create axios instance with default config
export const api = axios.create({
  baseURL: API_URL,
  // Add cache-busting headers
  headers: {
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0'
  }
});

// Add a unique timestamp to force cache invalidation
api.interceptors.request.use((config) => {
  // Add timestamp to force cache invalidation
  if (config.method === 'get') {
    config.params = { ...config.params, _t: Date.now() };
  }
  
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Add request interceptor to include token in headers
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Add response interceptor to handle 401 errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      sessionStorage.removeItem('token');
      document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
      window.location.href = '/auth/login';
    }
    return Promise.reject(error);
  }
);

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  full_name: string;
}

export const authService = {
  async login(email: string, password: string) {
    const formData = new FormData();
    formData.append('username', email);
    formData.append('password', password);

    const response = await api.post('/api/auth/token', formData);
    if (response.data.access_token) {
      const token = response.data.access_token;
      // Store token in localStorage
      localStorage.setItem('token', token);
      // Store token in sessionStorage
      sessionStorage.setItem('token', token);
      // Store token in cookies
      document.cookie = `token=${token}; path=/; max-age=86400`; // 24 hours
      return response.data;
    }
    return null;
  },

  async register(userData: { email: string; password: string; full_name: string }) {
    const response = await api.post('/api/auth/register', userData);
    return response.data;
  },

  async getCurrentUser() {
    const token = this.getToken();
    if (!token) return null;

    try {
      const response = await api.get('/api/auth/me');
      return response.data;
    } catch (error) {
      this.logout();
      return null;
    }
  },

  getToken() {
    return localStorage.getItem('token') || sessionStorage.getItem('token');
  },

  logout() {
    // Clear all auth-related data
    localStorage.removeItem('token');
    sessionStorage.removeItem('token');
    document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
    
    // Clear axios default headers
    delete api.defaults.headers.common['Authorization'];
    
    // Force a page reload to clear any cached state
    window.location.href = '/';
  },

  isAuthenticated() {
    return !!this.getToken();
  }
}; 