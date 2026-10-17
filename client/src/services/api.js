import axios from 'axios';

const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || '/api', timeout: 90000 }); // AI calls can be slow

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const url = err.config?.url || '';
    const isAuthForm = url.startsWith('/auth/') && url !== '/auth/me';
    if (err.response?.status === 401 && !isAuthForm) {
      localStorage.removeItem('token');
      if (!location.pathname.startsWith('/login')) location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export const errMsg = (e) => e.response?.data?.message || (e.code === 'ECONNABORTED' ? 'The request timed out. Please try again.' : e.message === 'Network Error' ? 'Cannot reach the server. Check your connection.' : e.message) || 'Something went wrong';
export default api;
