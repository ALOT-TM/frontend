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
      const statuses = ['ACTIVE', 'INACTIVE'];
      const results = await Promise.all(
        statuses.map((status) => this.listBeneficiariesByStatus(status))
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

export default new BeneficiaryQueryService();
