import axios from 'axios';
import {
  clearAuthSession,
  getStoredAuthToken,
  getStoredCompanyId,
  getStoredUserId,
  isJwtLike,
} from './authStorage';

const API_BASE_URL = 'http://localhost:8080/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para agregar token si existe
apiClient.interceptors.request.use((config) => {
  const requestUrl = String(config.url || '');
  const isAuthEndpoint =
    requestUrl.includes('/iam/login') || requestUrl.includes('/iam/register');

  if (isAuthEndpoint) {
    return config;
  }

  const token = getStoredAuthToken();
  if (isJwtLike(token)) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  const userId = getStoredUserId();
  if (userId) {
    config.headers['X-User-Id'] = String(userId);
  }

  const companyId = getStoredCompanyId();
  if (companyId) {
    config.headers['X-User-Company-Id'] = String(companyId);
  }

  return config;
});

// Interceptor para manejar errores
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      clearAuthSession();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default apiClient;
