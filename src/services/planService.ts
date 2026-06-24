import { api } from "./api";

export interface PlanDto {
  planId: number;
  name: string;
  price: number;
  maxUsers: number;
  maxStorage: number;
}

export const planService = {
  getPlans: async (): Promise<PlanDto[]> => {
    const response = await api.get<PlanDto[]>("/plans");
    return response.data;
  },

  startSubscription: async (retailCompanyId: number, planId: number, paymentMethodId: string): Promise<any> => {
    const response = await api.post("/subscriptions", {
      retailCompanyId,
      planId,
      paymentMethodId
    });
    return response.data;
  }
};
