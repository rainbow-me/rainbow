import { createRainbowStore } from '@/state/internal/createRainbowStore';

export type PerpsWithdrawalStoreType = ReturnType<typeof createPerpsWithdrawalStore>;

type PerpsWithdrawalState = {
  isSubmitting: boolean;
  setIsSubmitting: (isSubmitting: boolean) => void;
};

export function createPerpsWithdrawalStore() {
  return createRainbowStore<PerpsWithdrawalState>(set => ({
    isSubmitting: false,

    setIsSubmitting: isSubmitting =>
      set(state => {
        if (state.isSubmitting === isSubmitting) return state;
        return { isSubmitting };
      }),
  }));
}
