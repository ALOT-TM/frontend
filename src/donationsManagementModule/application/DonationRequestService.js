import apiClient from '../../shared/infrastructure/apiClient';

class DonationRequestService {
  async createRequest(mermaId, beneficiaryId, notes) {
    try {
      const response = await apiClient.post('/requests', {
        mermaId,
        beneficiaryId,
        notes,
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  async listRequestsByBeneficiary(beneficiaryId) {
    try {
      const response = await apiClient.get('/requests', {
        params: { beneficiaryId },
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  async listRequestsByMerma(mermaId) {
    try {
      const response = await apiClient.get(`/requests/merma/${mermaId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  async acceptRequest(requestId) {
    try {
      const response = await apiClient.patch(`/requests/${requestId}/accept`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  async rejectRequest(requestId) {
    try {
      const response = await apiClient.patch(`/requests/${requestId}/reject`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  async cancelRequest(requestId) {
    try {
      const response = await apiClient.patch(`/requests/${requestId}/cancel`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }
}

export default new DonationRequestService();
