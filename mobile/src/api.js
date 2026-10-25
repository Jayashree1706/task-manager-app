import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { API_URL } from './config';

export const TOKEN_KEY = 'access_token';

const api = axios.create({ baseURL: API_URL, timeout: 10000 });

let onUnauthorized = null;
export const setUnauthorizedHandler = (fn) => {
  onUnauthorized = fn;
};

// Attach the saved token to every request
api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync(TOKEN_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// If the server says the token is bad or expired, log the user out
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const isLogin = err.config && err.config.url && err.config.url.includes('/auth/login');
    if (err.response && err.response.status === 401 && !isLogin && onUnauthorized) {
      onUnauthorized(err.response.data && err.response.data.error);
    }
    return Promise.reject(err);
  }
);

// Turn any error into a friendly message
export const getErrorMessage = (err) => {
  if (err.response) {
    return err.response.data?.error || 'Something went wrong. Please try again.';
  }
  if (err.code === 'ECONNABORTED') {
    return 'The request timed out. Please try again.';
  }
  return 'No internet connection or server not reachable. Please check and try again.';
};

export const loginRequest = (email, password) =>
  api.post('/auth/login', { email, password }).then((r) => r.data);
export const fetchStats = () => api.get('/dashboard/stats').then((r) => r.data);
export const fetchTasks = (params) => api.get('/tasks', { params }).then((r) => r.data);
export const fetchTask = (id) => api.get(`/tasks/${id}`).then((r) => r.data);
export const createTask = (body) => api.post('/tasks', body).then((r) => r.data);
export const updateTask = (id, body) => api.put(`/tasks/${id}`, body).then((r) => r.data);
export const updateTaskStatus = (id, status) =>
  api.patch(`/tasks/${id}/status`, { status }).then((r) => r.data);
export const deleteTask = (id) => api.delete(`/tasks/${id}`).then((r) => r.data);

export default api;
