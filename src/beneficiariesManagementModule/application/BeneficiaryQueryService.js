import apiClient from '../../shared/infrastructure/apiClient';

class BeneficiaryQueryService {
  async getBeneficiaryById(beneficiaryId) {
    try {
      const response = await apiClient.get(`/beneficiaries/${beneficiaryId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  async listBeneficiariesByStatus(status) {
    try {
      const response = await apiClient.get('/beneficiaries', {
        params: { status },
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  async listAllBeneficiaries() {
    try {
      // Backend defaults to ACTIVE status when no status param provided
      const response = await apiClient.get('/beneficiaries');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }
}

export default new BeneficiaryQueryService();
