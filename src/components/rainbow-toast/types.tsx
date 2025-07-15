import { RainbowTransaction } from '@/entities';
import { RainbowToastMintStatuses, RainbowToastSendStatuses, RainbowToastSwapStatuses } from './getToastFromTransaction';

type BaseToast = {
  id: string;
  transactionHash: string;
  transaction: RainbowTransaction;
  action?: () => void;
  removing?: boolean | 'swipe';
};

export type RainbowToastSwap = BaseToast & {
  type: 'swap';
  status: keyof typeof RainbowToastSwapStatuses;
  fromChainId: number;
  toChainId: number;
  fromAssetSymbol: string;
  toAssetSymbol: string;
  fromAssetImage: string;
  toAssetImage: string;
};

export type RainbowToastSend = BaseToast & {
  type: 'send';
  chainId: number;
  status: keyof typeof RainbowToastSendStatuses;
  displayAmount: string;
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
