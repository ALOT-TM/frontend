import apiClient from '../../shared/infrastructure/apiClient';

class MermaQueryService {
  async getMermaById(mermaId) {
    try {
      const response = await apiClient.get(`/mermas/${mermaId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  async listMermasByStatus(status) {
    try {
      const response = await apiClient.get('/mermas', {
        params: { status },
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  async listAllMermas() {
    try {
      const statuses = ['REGISTERED', 'DONABLE', 'DONATED', 'NOT_DONABLE'];
      const results = await Promise.all(
        statuses.map((status) => this.listMermasByStatus(status))
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

export default new MermaQueryService();

