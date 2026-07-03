import { api } from "./api";

export interface PlanDto {
  planId: number;
  name: string;
  price: number;
  maxUsers: number;
  maxStorage: number;
}

export type SubscriptionStatus = "ACTIVE" | "PAST_DUE" | "CANCELLED";

export interface SubscriptionDto {
  subscriptionId: number;
  retailCompanyId: number;
  plan: PlanDto;
  status: SubscriptionStatus;
  startDate: string;
  endDate?: string | null;
}

export const planService = {
  getPlans: async (): Promise<PlanDto[]> => {
    const response = await api.get<PlanDto[]>("/plans");
    return response.data;
  },

  startSubscription: async (retailCompanyId: number, planId: number, paymentMethodId: string): Promise<SubscriptionDto> => {
    const response = await api.post<SubscriptionDto>("/subscriptions", {
      retailCompanyId,
      planId,
      paymentMethodId
    });
    return response.data;
  },

  getCurrentSubscription: async (): Promise<SubscriptionDto> => {
    const response = await api.get<SubscriptionDto>("/subscriptions/current");
    return response.data;
  },

  changeCurrentPlan: async (planId: number): Promise<SubscriptionDto> => {
    const response = await api.patch<SubscriptionDto>("/subscriptions/current/plan", { planId });
    return response.data;
  },

  cancelCurrentSubscription: async (): Promise<SubscriptionDto> => {
    const response = await api.patch<SubscriptionDto>("/subscriptions/current/cancel");
    return response.data;
  },

  reactivateCurrentSubscription: async (): Promise<SubscriptionDto> => {
    const response = await api.patch<SubscriptionDto>("/subscriptions/current/reactivate");
    return response.data;
  },
};
