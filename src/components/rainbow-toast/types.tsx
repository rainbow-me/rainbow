import { RainbowToastMintStatuses, RainbowToastSendStatuses, RainbowToastSwapStatuses } from './getToastFromTransaction';

type BaseToast = {
  id: string;
  transactionHash: string;
  action?: () => void;
  removing?: boolean | 'swipe';
};

export type RainbowToastSwap = BaseToast & {
  type: 'swap';
  status: keyof typeof RainbowToastSwapStatuses;
  fromChainId: number;
  toChainId: number;
};

export type RainbowToastSend = BaseToast & {
  type: 'send';
  chainId: number;
  status: keyof typeof RainbowToastSendStatuses;
  amount: number;
  token: string;
  tokenName: string;
};

export type RainbowToastMint = BaseToast & {
  type: 'mint';
  chainId: number;
  status: keyof typeof RainbowToastMintStatuses;
  name: string;
  image: string;
};

export type RainbowToast = RainbowToastSwap | RainbowToastSend | RainbowToastMint;

export type RainbowToastWithIndex = RainbowToast & {
  index: number;
};

export interface RainbowToastState {
  toasts: RainbowToast[];
  showToast(toast: RainbowToast): void;
}
