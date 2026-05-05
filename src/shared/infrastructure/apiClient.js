import axios from 'axios';

const API_BASE_URL = 'http://localhost:8080/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

const isJwtLike = (token) => {
  if (!token || typeof token !== 'string') {
    return false;
  }
  const parts = token.split('.');
  return parts.length === 3 && parts.every((part) => part.length > 0);
};

const pickToken = (rawToken) => {
  if (!rawToken) {
    return null;
  }

  if (typeof rawToken === 'string') {
    // Raw token string or serialized object.
    if (rawToken.startsWith('{') || rawToken.startsWith('[')) {
      try {
        const parsed = JSON.parse(rawToken);
        return (
          parsed?.token ??
          parsed?.accessToken ??
          parsed?.jwt ??
          parsed?.jwtToken ??
          parsed?.authToken ??
          null
        );
      } catch {
        return null;
      }
    }
    return rawToken;
  }

  return (
    rawToken?.token ??
    rawToken?.accessToken ??
    rawToken?.jwt ??
    rawToken?.jwtToken ??
    rawToken?.authToken ??
    null
  );
};

const pickUserId = (rawUser) => {
  if (!rawUser) {
    return null;
  }

  try {
    const user = typeof rawUser === 'string' ? JSON.parse(rawUser) : rawUser;
    return (
      user?.id ??
      user?.userId ??
      user?.userId?.value ??
      user?.id?.value ??
      user?.userIdValue ??
      user?.userId?.id ??
      null
    );
  } catch {
    return null;
  }
};

// Interceptor para agregar token si existe
apiClient.interceptors.request.use((config) => {
  const requestUrl = String(config.url || '');
  const isAuthEndpoint =
    requestUrl.includes('/iam/login') || requestUrl.includes('/iam/register');

  if (isAuthEndpoint) {
    return config;
  }

  const tokenRaw = localStorage.getItem('authToken');
  const token = pickToken(tokenRaw);
  if (isJwtLike(token)) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  const storedUserId = localStorage.getItem('userId');
  const userRaw = localStorage.getItem('user');
  const userId = storedUserId ?? pickUserId(userRaw) ?? pickUserId(tokenRaw);
  if (userId) {
    config.headers['X-User-Id'] = String(userId);
  }

  return config;
});

// Interceptor para manejar errores
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default apiClient;
