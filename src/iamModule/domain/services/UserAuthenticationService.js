import apiClient from '../../../shared/infrastructure/apiClient';

const pickUserId = (user) => {
  if (!user) {
    return null;
  }

  return (
    user?.id ??
    user?.userId ??
    user?.userId?.value ??
    user?.id?.value ??
    user?.userIdValue ??
    user?.userId?.id ??
    null
  );
};

const pickToken = (user) => {
  if (!user) {
    return null;
  }

  return (
    user?.token ??
    user?.accessToken ??
    user?.jwt ??
    user?.jwtToken ??
    user?.authToken ??
    null
  );
};

const isJwtLike = (token) => {
  if (!token || typeof token !== 'string') {
    return false;
  }
  const parts = token.split('.');
  return parts.length === 3 && parts.every((part) => part.length > 0);
};

class UserAuthenticationService {
  async register(email, rawPassword, role) {
    try {
      const response = await apiClient.post('/iam/register', {
        email,
        rawPassword,
        role,
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  async login(email, rawPassword) {
    try {
      const response = await apiClient.post('/iam/login', {
        email,
        rawPassword,
      });

      if (response.data) {
        const userId = pickUserId(response.data);
        const token = pickToken(response.data);

        localStorage.setItem('user', JSON.stringify(response.data));
        if (userId) {
          localStorage.setItem('userId', String(userId));
        }

        if (isJwtLike(token)) {
          localStorage.setItem('authToken', token);
        } else {
          localStorage.removeItem('authToken');
        }
      }

      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  logout() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    localStorage.removeItem('userId');
  }

  getCurrentUser() {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  }

  isAuthenticated() {
    return !!localStorage.getItem('authToken');
  }

  getUserRole() {
    const user = this.getCurrentUser();
    return user?.role || null;
  }
}

export default new UserAuthenticationService();
