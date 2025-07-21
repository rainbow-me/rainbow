import { RainbowTransaction } from '@/entities';
import { RainbowToastContractStatuses, RainbowToastSendStatuses, RainbowToastSwapStatuses } from './getToastFromTransaction';

type BaseToast = {
  id: string;
  transactionHash: string;
  transaction: RainbowTransaction;
  action?: () => void;
  isRemoving?: boolean;
  removalReason?: 'swipe' | 'finish';
  updatedAt?: number;
};

export type RainbowToastSwap = BaseToast & {
  type: 'swap';
  status: keyof typeof RainbowToastSwapStatuses;
  chainId: number;
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

export type RainbowToastContract = BaseToast & {
  type: 'contract';
  chainId: number;
  status: keyof typeof RainbowToastContractStatuses;
  name: string;
  image: string;
};

export type RainbowToast = RainbowToastSwap | RainbowToastSend | RainbowToastContract;

export type RainbowToastWithIndex = RainbowToast & {
  index: number;
};

export interface RainbowToastState {
  toasts: RainbowToast[];
  showToast(toast: RainbowToast): void;
}
