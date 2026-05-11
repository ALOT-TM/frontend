import apiClient from '../../../shared/infrastructure/apiClient';
import {
  clearAuthSession,
  getStoredAuthToken,
  persistAuthSession,
  readAuthSession,
  isJwtLike,
} from '../../../shared/infrastructure/authStorage';

class UserAuthenticationService {
  async register(email, rawPassword, role, companyId = null) {
    try {
      const response = await apiClient.post('/iam/register', {
        email,
        rawPassword,
        role,
        companyId,
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
        const session = persistAuthSession(response.data);
        return session;
      }

      return null;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  logout() {
    clearAuthSession();
  }

  getCurrentUser() {
    return readAuthSession()?.user ?? null;
  }

  isAuthenticated() {
    return isJwtLike(getStoredAuthToken());
  }

  getUserRole() {
    const user = this.getCurrentUser();
    return user?.role || null;
  }
}

export default new UserAuthenticationService();
