import apiClient from '../../shared/infrastructure/apiClient';

class DonationCommandService {
  async createDonation(mermaReferenceId, beneficiaryReferenceId, quantity, scheduledDeliveryDate) {
    try {
      const response = await apiClient.post('/donations/create', {
        mermaReferenceId,
        beneficiaryReferenceId,
        quantity,
        scheduledDeliveryDate,
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  async markDelivered(donationId, deliveryDate) {
    try {
      const response = await apiClient.patch(`/donations/${donationId}/delivered`, {
        deliveryDate,
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  async confirmReception(donationId, receptionDate, comment) {
    try {
      const response = await apiClient.patch(`/donations/${donationId}/confirm`, {
        receptionDate,
        comment,
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }
}

export default new DonationCommandService();

