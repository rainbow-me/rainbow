import { type RainbowToast } from '@/components/rainbow-toast/types';
import { RainbowTransaction } from '@/entities';
import { Navigation } from '@/navigation';
import Routes from '@/navigation/routesNames';
import { Mints } from '@/resources/mints';

export const txIdToToastId = (tx: RainbowTransaction): string => (tx.nonce ? `${tx.nonce}` : tx.hash + (tx.chainId || tx.asset?.chainId));

export function getToastFromTransaction({
  transaction: tx,
  mints,
}: {
  transaction: RainbowTransaction;
  mints?: Mints;
}): RainbowToast | null {
  if (tx.type === 'swap') {
    // only pending trasactions hvae this, but for failed or success we don't show asset icons
    // we just show a check or x so we don't need it
    const outAsset = tx.changes?.find(c => c?.direction === 'out')?.asset;
    const inAsset = tx.changes?.find(c => c?.direction === 'in')?.asset;

    return {
      id: txIdToToastId(tx),
      type: 'swap',
      currentType: tx.type,
      transaction: tx,
      transactionHash: tx.hash,
      status: tx.status,
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

  if (tx.type === 'send') {
    const symbol = tx.asset?.symbol || tx.symbol || '';
    return {
      id: txIdToToastId(tx),
      type: 'send',
      currentType: tx.type,
      transaction: tx,
      chainId: tx.chainId,
      transactionHash: tx.hash,
      status: tx.status,
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

  // swap and send have unique styles
  //  - swap is overlapping circular icons for tokens with a custom subtitle showing the tokens
  //  - send is a circular icon with the amount as the subtitle
  //  the rest of the transaction types fall through to here, they get a
  //  rounded icon and we show a generic label based on the status

  const mint = tx.type === 'mint' ? mints?.find(mint => mint.contractAddress === tx.hash) : null;

  const name = tx.contract?.name || tx.description;

  if (!name) {
    console.error(`Unknown transaction for toast`, tx);
    return null;
  }

  return {
    id: txIdToToastId(tx),
    type: 'contract',
    transaction: tx,
    chainId: tx.chainId,
    transactionHash: tx.hash,
    currentType: tx.type,
    status: tx.status,
    name,
    image:
      // mint or other
      tx.contract?.iconUrl ||
      // nft/token
      tx.asset?.icon_url ||
      //  mint
      mint?.imageURL ||
      // sale
      tx.changes?.[0]?.asset?.images?.lowResUrl ||
      '',
    action: () => {
      Navigation.handleAction(Routes.TRANSACTION_DETAILS, {
        transaction: tx,
      });
    },
  };
}
