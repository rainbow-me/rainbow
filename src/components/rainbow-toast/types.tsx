export type RainbowToast = {
  id: string;
  index: number;
  type: 'swap';
  state: 'swapping' | 'swapped';
  fromToken: string;
  toToken: string;
  action?: () => void;
};

export interface RainbowToastState {
  toasts: RainbowToast[];
  showToast(toast: RainbowToast): void;
}
