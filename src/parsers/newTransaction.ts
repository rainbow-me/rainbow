import { getDescription, getTitle } from './transactions';
import {
  NewTransaction,
  RainbowTransaction,
  TransactionStatus,
  TransactionType,
  // @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/entities' or its c... Remove this comment to see the full error message
} from '@rainbow-me/entities';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/references' or its... Remove this comment to see the full error message
import { ETH_ADDRESS } from '@rainbow-me/references';
import {
  convertAmountAndPriceToNativeDisplay,
  convertAmountToBalanceDisplay,
  // @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/utilities' or its ... Remove this comment to see the full error message
} from '@rainbow-me/utilities';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/utils' or its corr... Remove this comment to see the full error message
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
  const {
    amount,
    asset,
    dappName,
    data,
    from,
    gasLimit,
    gasPrice,
    maxFeePerGas,
    maxPriorityFeePerGas,
    network,
    nonce,
    hash: txHash,
    protocol,
    sourceAmount,
    status: txStatus,
    to,
    transferId,
    type: txType,
    txTo,
    value,
  } = txDetails;

  if (amount && asset) {
    balance = {
      amount,
      display: convertAmountToBalanceDisplay(amount, asset),
    };
  }

  const assetPrice =
    asset?.price?.value ?? ethereumUtils.getAssetPrice(asset?.address);
  const native = convertAmountAndPriceToNativeDisplay(
    amount ?? 0,
    assetPrice,
    nativeCurrency
  );
  const hash = txHash ? `${txHash}-0` : null;

  const status = txStatus ?? TransactionStatus.sending;
  const type = txType ?? TransactionType.send;

  const title = getTitle({
    protocol: protocol ?? null,
    status,
    type,
  });

  const description = getDescription({
    name: asset?.name ?? null,
    status,
    type,
  });

  return {
    address: asset?.address ?? ETH_ADDRESS,
    balance,
    dappName,
    data,
    description,
    from,
    gasLimit,
    gasPrice,
    hash,
    maxFeePerGas,
    maxPriorityFeePerGas,
    minedAt: null,
    name: asset?.name ?? null,
    native,
    network,
    nonce,
    pending: true,
    protocol,
    sourceAmount,
    status,
    symbol: asset?.symbol ?? null,
    title,
    to,
    transferId,
    txTo: txTo || to,
    type,
    value,
  };
};
