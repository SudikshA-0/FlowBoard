import axios from 'axios';

let onUnauthorized = null;

export const setUnauthorizedHandler = (handler) => {
  onUnauthorized = handler;
};

export const triggerUnauthorized = () => {
  if (typeof onUnauthorized === 'function') onUnauthorized();
};

const http = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
});

http.interceptors.request.use((config) => {
  const token = localStorage.getItem('fb_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

http.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('fb_token');
      localStorage.removeItem('fb_user');
      if (typeof onUnauthorized === 'function') onUnauthorized();
    }
    return Promise.reject(error);
  }
);

export default http;
