import { getDescription, getTitle } from './transactions';
import {
  NewTransaction,
  RainbowTransaction,
  TransactionStatus,
  TransactionType,
} from '@rainbow-me/entities';
import { ETH_ADDRESS } from '@rainbow-me/references';
import {
  convertAmountAndPriceToNativeDisplay,
  convertAmountToBalanceDisplay,
} from '@rainbow-me/utilities';
import { ethereumUtils } from '@rainbow-me/utils';

/**
 * @desc parse transactions from native prices
 * @param  {Object} [txDetails=null]
 * @param  {Object} [nativeCurrency='']
 * @return {String}
 */
export const parseNewTransaction = async (
  txDetails: NewTransaction,
  nativeCurrency: string = ''
): Promise<RainbowTransaction> => {
  let balance = null;
  const { amount } = txDetails;
  if (amount && txDetails.asset) {
    balance = {
      amount,
      display: convertAmountToBalanceDisplay(amount, txDetails.asset),
    };
  }

  const assetPrice =
    txDetails?.asset?.price?.value ??
    ethereumUtils.getAssetPrice(txDetails?.asset?.address);
  const native = convertAmountAndPriceToNativeDisplay(
    amount ?? 0,
    assetPrice,
    nativeCurrency
  );
  const hash = txDetails.hash ? `${txDetails.hash}-0` : null;

  const status = txDetails?.status ?? TransactionStatus.sending;
  const type = txDetails?.type ?? TransactionType.send;

  const title = getTitle({
    protocol: txDetails?.protocol ?? null,
    status,
    type,
  });

  const description = getDescription({
    name: txDetails?.asset?.name ?? null,
    status,
    type,
  });

  return {
    address: txDetails?.asset?.address ?? ETH_ADDRESS,
    balance,
    dappName: txDetails.dappName,
    description,
    from: txDetails.from,
    gasLimit: txDetails.gasLimit,
    gasPrice: txDetails.gasPrice,
    hash,
    minedAt: null,
    name: txDetails?.asset?.name ?? null,
    native,
    network: txDetails.network,
    nonce: txDetails.nonce,
    pending: true,
    protocol: txDetails?.protocol,
    sourceAmount: txDetails.sourceAmount,
    status,
    symbol: txDetails?.asset?.symbol ?? null,
    title,
    to: txDetails.to,
    transferId: txDetails.transferId,
    type,
  };
};
