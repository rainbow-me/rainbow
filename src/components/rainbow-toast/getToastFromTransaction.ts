import { type RainbowToast } from '@/components/rainbow-toast/types';
import { RainbowTransaction, TransactionStatus } from '@/entities';
import { Navigation } from '@/navigation';
import Routes from '@/navigation/routesNames';

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

const txIdToToastId = (tx: RainbowTransaction) => tx.hash + tx.address + tx.chainId;

export function getToastFromTransaction(tx: RainbowTransaction): RainbowToast | null {
  if (tx.swap) {
    const toastState = getSwapToastStatus(tx.status);
    if (toastState) {
      return {
        id: txIdToToastId(tx),
        transactionHash: tx.hash,
        type: 'swap',
        status: toastState,
        fromChainId: tx.swap.fromChainId,
        toChainId: tx.swap.toChainId,
        action: () => {
          Navigation.handleAction(Routes.TRANSACTION_DETAILS, {
            transaction: tx,
          });
        },
      };
    }
  }

  if (tx.type === 'send') {
    const toastState = getSendToastStatus(tx.status);
    if (toastState) {
      return {
        id: txIdToToastId(tx),
        transactionHash: tx.hash,
        type: 'send',
        status: toastState,
        amount: parseFloat(tx.value?.toString() || '0'),
        token: tx.symbol || 'ETH',
        action: () => {
          Navigation.handleAction(Routes.TRANSACTION_DETAILS, {
            transaction: tx,
          });
        },
      };
    }
  }

  if (tx.type === 'mint') {
    const toastState = getMintToastStatus(tx.status);
    if (toastState) {
      return {
        id: txIdToToastId(tx),
        transactionHash: tx.hash,
        type: 'mint',
        status: toastState,
        name: tx.title || 'NFT',
        image: tx.description || '',
        action: () => {
          Navigation.handleAction(Routes.TRANSACTION_DETAILS, {
            transaction: tx,
          });
        },
      };
    }
  }

  return null;
}
