import { RainbowToastState } from '@/components/rainbow-toast/types';
import { createRainbowStore } from '@/state/internal/createRainbowStore';

export const useRainbowToasts = createRainbowStore<RainbowToastState>(set => ({
  toasts: [],
  showToast(toast) {
    set(state => ({
      toasts: [toast, ...state.toasts],
    }));
  },
}));

export const { showToast } = useRainbowToasts.getState();
