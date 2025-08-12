import { RainbowTransaction, TransactionStatus, TransactionType } from '@/entities';

type BaseToast = {
  id: string;
  status: TransactionStatus;
  // we keep the same base type to show the toast the same
  // but update currentType to if a new transaction comes in with a diff type
  // example of this is send => speed_up, the type changes
  currentType: TransactionType;
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
  name: string;
  image: string;
};

export type RainbowToast = RainbowToastSwap | RainbowToastSend | RainbowToastContract;

export type RainbowToastWithIndex = RainbowToast & {
  index: number;
};
