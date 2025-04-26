import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// Create axios instance with default config
export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
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

    const response = await api.post('/auth/token', formData);
    if (response.data.access_token) {
      localStorage.setItem('token', response.data.access_token);
      return response.data;
    }
    return null;
  },

  async register(userData: { email: string; password: string; full_name: string }) {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },

  async getCurrentUser() {
    const token = this.getToken();
    if (!token) return null;

    try {
      const response = await api.get('/auth/me');
      return response.data;
    } catch (error) {
      this.logout();
      return null;
    }
  },

  getToken() {
    return localStorage.getItem('token');
  },

  logout() {
    // Clear all auth-related data
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    // Clear axios default headers
    delete api.defaults.headers.common['Authorization'];
    
    // Force a page reload to clear any cached state
    window.location.href = '/auth/login';
  },

  isAuthenticated() {
    return !!this.getToken();
  }
}; 