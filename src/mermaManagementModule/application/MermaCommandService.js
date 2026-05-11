import apiClient from '../../shared/infrastructure/apiClient';

class MermaCommandService {
  async registerMerma(productName, categoryName, quantity, expirationDate, reason) {
    try {
      const response = await apiClient.post('/mermas/register', {
        productName,
        categoryName,
        quantity,
        expirationDate,
        reason,
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  async markDonable(mermaId) {
    try {
      const response = await apiClient.patch(`/mermas/${mermaId}/donable`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  async markNotDonable(mermaId) {
    try {
      const response = await apiClient.patch(`/mermas/${mermaId}/not-donable`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  async markDonated(mermaId) {
    try {
      const response = await apiClient.patch(`/mermas/${mermaId}/donated`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }
}

export default new MermaCommandService();

