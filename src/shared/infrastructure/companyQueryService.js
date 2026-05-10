import apiClient from './apiClient';

class CompanyQueryService {
  async listCompanies() {
    try {
      const response = await apiClient.get('/companies');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }
}

export default new CompanyQueryService();
