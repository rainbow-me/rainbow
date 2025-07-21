import { type RainbowToast } from '@/components/rainbow-toast/types';
import { RainbowTransaction, TransactionStatus } from '@/entities';
import { logger } from '@/logger';
import { Navigation } from '@/navigation';
import Routes from '@/navigation/routesNames';
import { Mints } from '@/resources/mints';

export const RainbowToastSwapStatuses = {
  [TransactionStatus.pending]: TransactionStatus.swapping,
  [TransactionStatus.swapping]: TransactionStatus.swapping,
  [TransactionStatus.swapped]: TransactionStatus.swapped,
  [TransactionStatus.failed]: TransactionStatus.failed,
} as const;

export const RainbowToastSendStatuses = {
  [TransactionStatus.pending]: TransactionStatus.pending,
  [TransactionStatus.sending]: TransactionStatus.sending,
  [TransactionStatus.sent]: TransactionStatus.sent,
  [TransactionStatus.confirmed]: TransactionStatus.confirmed,
  [TransactionStatus.failed]: TransactionStatus.failed,
} as const;

export const RainbowToastContractStatuses = {
  [TransactionStatus.pending]: TransactionStatus.pending,
  [TransactionStatus.contract_interaction]: TransactionStatus.contract_interaction,
  [TransactionStatus.minting]: TransactionStatus.minting,
  [TransactionStatus.minted]: TransactionStatus.minted,
  [TransactionStatus.failed]: TransactionStatus.failed,
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

export function getContractToastStatus(status: TransactionStatus): keyof typeof RainbowToastContractStatuses | null {
  if (status in RainbowToastContractStatuses) {
    return status as keyof typeof RainbowToastContractStatuses;
  }
  return null;
}

const txIdToToastId = (tx: RainbowTransaction) => tx.hash + tx.address + tx.chainId;

export function getToastFromTransaction(tx: RainbowTransaction, mints?: Mints): RainbowToast | null {
  if (tx.swap) {
    const status = getSwapToastStatus(tx.status);
    if (status) {
      const outAsset = tx.changes?.find(c => c?.direction === 'out')?.asset;
      const inAsset = tx.changes?.find(c => c?.direction === 'in')?.asset;

      if (!outAsset || !inAsset) {
        logger.warn(`Missing in or out asset for transaction ${tx.hash}`);
        return null;
      }

      return {
        id: txIdToToastId(tx),
        transaction: tx,
        transactionHash: tx.hash,
        type: 'swap',
        status,
        fromChainId: tx.swap.fromChainId,
        toChainId: tx.swap.toChainId,
        fromAssetSymbol: outAsset.symbol,
        toAssetSymbol: inAsset.symbol,
        fromAssetImage: outAsset.icon_url || '',
        toAssetImage: inAsset.icon_url || '',
        action: () => {
          Navigation.handleAction(Routes.TRANSACTION_DETAILS, {
            transaction: tx,
          });
        },
      };
    }
  }

  if (tx.type === 'send') {
    const status = getSendToastStatus(tx.status);
    if (status) {
      const symbol = tx.asset?.symbol || tx.symbol || '';
      return {
        id: txIdToToastId(tx),
        transaction: tx,
        chainId: tx.chainId,
        transactionHash: tx.hash,
        type: 'send',
        status,
        // @ts-expect-error it is there
        displayAmount: tx.asset?.balance?.display || '0',
        token: symbol,
        tokenName: tx.asset?.name || tx.name || '',
        action: () => {
          Navigation.handleAction(Routes.TRANSACTION_DETAILS, {
            transaction: tx,
          });
        },
      };
    }
  }

  if (tx.type === 'mint' || tx.type === 'contract_interaction') {
    const mint = mints?.find(mint => mint.contractAddress === tx.hash);
    const status = getContractToastStatus(tx.status);
    if (status) {
      return {
        id: txIdToToastId(tx),
        transaction: tx,
        chainId: tx.chainId,
        transactionHash: tx.hash,
        type: 'contract',
        status,
        name: tx.contract?.name || tx.title || 'NFT',
        // @ts-expect-error it is there
        image: tx.contract?.iconUrl || mint?.imageURL || min?.asset || '',
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
