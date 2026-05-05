import apiClient from '../../shared/infrastructure/apiClient';

class BeneficiaryCommandService {
  async registerBeneficiary(name, type, address, acceptedProducts) {
    try {
      const response = await apiClient.post('/beneficiaries/register', {
        name,
        type,
        address,
        acceptedProducts,
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  async updateBeneficiary(beneficiaryId, name, type, address, acceptedProducts) {
    try {
      const response = await apiClient.put(`/beneficiaries/${beneficiaryId}`, {
        name,
        type,
        address,
        acceptedProducts,
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  async activateBeneficiary(beneficiaryId) {
    try {
      const response = await apiClient.patch(`/beneficiaries/${beneficiaryId}/activate`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  async deactivateBeneficiary(beneficiaryId) {
    try {
      const response = await apiClient.patch(`/beneficiaries/${beneficiaryId}/deactivate`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }
}

export default new BeneficiaryCommandService();

