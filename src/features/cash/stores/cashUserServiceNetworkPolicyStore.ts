import { createBaseStore } from '@storesjs/stores';

type CashUserServiceNetworkPolicyStore = {
  visible: boolean;
  dismiss: () => void;
  show: () => void;
};

export const useCashUserServiceNetworkPolicyStore = createBaseStore<CashUserServiceNetworkPolicyStore>(set => ({
  visible: false,
  dismiss: () => set({ visible: false }),
  show: () => set({ visible: true }),
}));
