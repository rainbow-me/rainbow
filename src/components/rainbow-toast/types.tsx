export type RainbowToast = { id: string; type: 'swap'; state: 'swapping' | 'swapped'; fromToken: string; toToken: string };

export interface RainbowToastState {
  toasts: RainbowToast[];
  showToast(toast: RainbowToast): void;
}
