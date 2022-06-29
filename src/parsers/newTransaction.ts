import { getDescription, getTitle } from './transactions';
import {
  NewTransactionOrAddCashTransaction,
  RainbowTransaction,
  TransactionStatus,
  TransactionType,
} from '@rainbow-me/entities';
import { isL2Network } from '@rainbow-me/handlers/web3';
import { ETH_ADDRESS, supportedNativeCurrencies } from '@rainbow-me/references';
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
  txDetails: NewTransactionOrAddCashTransaction,
  nativeCurrency: keyof typeof supportedNativeCurrencies
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

  const native =
    network && isL2Network(network)
      ? { amount: '', display: '' }
      : convertAmountAndPriceToNativeDisplay(
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
