import apiClient from '../../shared/infrastructure/apiClient';

class DonationQueryService {
  async getDonationById(donationId) {
    try {
      const response = await apiClient.get(`/donations/${donationId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  async listDonationsByStatus(status) {
    try {
      const response = await apiClient.get('/donations', {
        params: { status },
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  async listDonationsByBeneficiary(beneficiaryId) {
    try {
      const response = await apiClient.get(`/donations/by-beneficiary/${beneficiaryId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  async listAllDonations() {
    try {
      const statuses = ['ASSIGNED', 'DELIVERED', 'CONFIRMED'];
      const results = await Promise.all(
        statuses.map((status) => this.listDonationsByStatus(status))
      );
      const merged = results.flat().filter(Boolean);
      const seen = new Set();
      return merged.filter((item) => {
        const id = item?.id;
        if (id === null || id === undefined) {
          return true;
        }
        if (seen.has(id)) {
          return false;
        }
        seen.add(id);
        return true;
      });
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }
}

export default new DonationQueryService();
