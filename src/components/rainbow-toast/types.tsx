import { TransactionStatus } from '@/entities';

type BaseToast = {
  id: string;

  action?: () => void;
  removed?: boolean;
};

export const RainbowToastSwapStatuses = {
  [TransactionStatus.pending]: TransactionStatus.swapping,
  [TransactionStatus.swapping]: TransactionStatus.swapping,
  [TransactionStatus.swapped]: TransactionStatus.swapped,
} as const;

export const RainbowToastSendStatuses = {
  [TransactionStatus.sending]: TransactionStatus.sending,
  [TransactionStatus.sent]: TransactionStatus.sent,
  [TransactionStatus.failed]: TransactionStatus.failed,
} as const;

export const RainbowToastMintStatuses = {
  [TransactionStatus.minting]: TransactionStatus.minting,
  [TransactionStatus.minted]: TransactionStatus.minted,
} as const;

export function getSwapToastStatus(status: TransactionStatus): keyof typeof RainbowToastSwapStatuses | null {
  if (status in RainbowToastSwapStatuses) {
    return status as keyof typeof RainbowToastSwapStatuses;
  }
  return null;
}

export function getSendToastStatus(status: TransactionStatus): keyof typeof RainbowToastSendStatuses | null {
  if (status in RainbowToastSendStatuses) {
    return status as keyof typeof RainbowToastSendStatuses;
  }
  return null;
}

export function getMintToastStatus(status: TransactionStatus): keyof typeof RainbowToastMintStatuses | null {
  if (status in RainbowToastMintStatuses) {
    return status as keyof typeof RainbowToastMintStatuses;
  }
  return null;
}

export type RainbowToastSwap = BaseToast & {
  type: 'swap';
  status: keyof typeof RainbowToastSwapStatuses;
  fromChainId: number;
  toChainId: number;
};

export type RainbowToastSend = BaseToast & {
  type: 'send';
  status: keyof typeof RainbowToastSendStatuses;
  amount: number;
  token: string;
};

export type RainbowToastMint = BaseToast & {
  type: 'mint';
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
