import { type RainbowToast } from '@/components/rainbow-toast/types';
import { RainbowTransaction, TransactionStatus } from '@/entities';
import { Navigation } from '@/navigation';
import Routes from '@/navigation/routesNames';
import { Mints } from '@/resources/mints';

export const RainbowToastSwapStatuses = {
  [TransactionStatus.pending]: TransactionStatus.swapping,
  [TransactionStatus.swapping]: TransactionStatus.swapping,
  [TransactionStatus.swapped]: TransactionStatus.swapped,
  [TransactionStatus.confirmed]: TransactionStatus.confirmed,
  [TransactionStatus.failed]: TransactionStatus.failed,
} as const;

export const RainbowToastSendStatuses = {
  [TransactionStatus.pending]: TransactionStatus.pending,
  [TransactionStatus.sending]: TransactionStatus.sending,
  [TransactionStatus.sent]: TransactionStatus.sent,
  [TransactionStatus.confirmed]: TransactionStatus.confirmed,
  [TransactionStatus.failed]: TransactionStatus.failed,
} as const;

function getSwapToastStatus(status: TransactionStatus): keyof typeof RainbowToastSwapStatuses | null {
  if (status in RainbowToastSwapStatuses) {
    return status as keyof typeof RainbowToastSwapStatuses;
  }
  return null;
}

function getSendToastStatus(status: TransactionStatus): keyof typeof RainbowToastSendStatuses | null {
  if (status in RainbowToastSendStatuses) {
    return status as keyof typeof RainbowToastSendStatuses;
  }
  return null;
}

export const txIdToToastId = (tx: RainbowTransaction) => tx.hash + (tx.address || tx.asset?.address) + (tx.chainId || tx.asset?.chainId);

export function getToastFromTransaction({
  transaction: tx,
  existingToast,
  mints,
}: {
  transaction: RainbowTransaction;
  existingToast?: RainbowToast;
  mints?: Mints;
}): RainbowToast | null {
  if (tx.type === 'swap') {
    const status = getSwapToastStatus(tx.status);
    if (status) {
      // only pending trasactions hvae this, but for failed or success we don't show asset icons
      // we just show a check or x so we don't need it
      const outAsset = tx.changes?.find(c => c?.direction === 'out')?.asset;
      const inAsset = tx.changes?.find(c => c?.direction === 'in')?.asset;

      return {
        id: txIdToToastId(tx),
        transaction: tx,
        transactionHash: tx.hash,
        type: 'swap',
        status,
        chainId: tx.swap ? tx.swap.fromChainId : tx.chainId,
        fromAssetSymbol: outAsset?.symbol || '',
        toAssetSymbol: inAsset?.symbol || '',
        fromAssetImage: outAsset?.icon_url || '',
        toAssetImage: inAsset?.icon_url || '',
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

  // swap and send have unique styles
  //  - swap is overlapping circular icons for tokens with a custom subtitle showing the tokens
  //  - send is a circular icon with the amount as the subtitle
  //  the rest of the transaction types fall through to here, they get a
  //  rounded icon and we show a generic label based on the status

  const mint = tx.type === 'mint' ? mints?.find(mint => mint.contractAddress === tx.hash) : null;

  if (existingToast && existingToast.type !== 'contract') {
    throw new Error(`Toast type guard, should never hit`);
  }

  return {
    id: txIdToToastId(tx),
    transaction: tx,
    chainId: tx.chainId,
    transactionHash: tx.hash,
    type: 'contract',
    status: tx.status,
    // in the case of contracts, as it goes from pending to finalized it loses some information
    // we want to keep the existing image and name if possible, so defer to existing toast
    name: existingToast?.name || tx.contract?.name || tx.title || 'NFT',
    image: existingToast?.image || tx.contract?.iconUrl || mint?.imageURL || '',
    action: () => {
      Navigation.handleAction(Routes.TRANSACTION_DETAILS, {
        transaction: tx,
      });
    },
  };
}
