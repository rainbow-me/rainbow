import { createRainbowStore } from '@/state/internal/createRainbowStore';

export interface AddressCopiedToastState {
  isActive: boolean;
  setIsActive: (active: boolean) => void;
}

export const useAddressCopiedToastStore = createRainbowStore<AddressCopiedToastState>(
  set => ({
    isActive: false,
    setIsActive: (active: boolean) => set({ isActive: active }),
  })
);

export const getAddressCopiedToastStore = () => useAddressCopiedToastStore.getState();

// Static function exports for legacy compatibility
export const setAddressCopiedToastActive = (active: boolean) => getAddressCopiedToastStore().setIsActive(active);