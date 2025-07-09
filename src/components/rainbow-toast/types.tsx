type BaseToast = {
  id: string;

  action?: () => void;
  removed?: boolean;
};

export type RainbowToast =
  | (BaseToast & {
      type: 'swap';
      state: 'swapping' | 'swapped';
      fromToken: string;
      toToken: string;
    })
  | (BaseToast & {
      type: 'send';
      state: 'sending' | 'sent' | 'failed';
      amount: number;
      token: string;
    })
  | (BaseToast & {
      type: 'mint';
      state: 'minting' | 'minted';
      name: string;
      image: string;
    });

export type RainbowToastWithIndex = RainbowToast & {
  index: number;
};

export interface RainbowToastState {
  toasts: RainbowToast[];
  showToast(toast: RainbowToast): void;
}
