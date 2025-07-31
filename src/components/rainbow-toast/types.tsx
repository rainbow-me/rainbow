import { RainbowTransaction, TransactionStatus, TransactionType } from '@/entities';

type BaseToast = {
  id: string;
  status: TransactionStatus;
  transactionHash: string;
  chainId: number;
  transaction: RainbowTransaction;
  action?: () => void;
  isRemoving?: boolean;
  removalReason?: 'swipe' | 'finish';
  updatedAt?: number;
};

export type RainbowToastSwap = BaseToast & {
  type: 'swap';
  fromAssetSymbol: string;
  toAssetSymbol: string;
  fromAssetImage: string;
  toAssetImage: string;
};

export type RainbowToastSend = BaseToast & {
  type: 'send';
  displayAmount: string;
  token: string;
  tokenName: string;
};

export type RainbowToastContract = BaseToast & {
  type: 'contract';
  subType: TransactionType;
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
