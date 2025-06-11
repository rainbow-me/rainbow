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

// export static functions
export const { setIsActive } = useAddressCopiedToastStore.getState();