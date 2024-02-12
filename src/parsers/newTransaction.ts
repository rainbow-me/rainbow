import { NativeCurrencyKey, NewTransactionOrAddCashTransaction, RainbowTransaction } from '@/entities';
import { isL2Network } from '@/handlers/web3';
import { ETH_ADDRESS } from '@/references';
import { convertAmountAndPriceToNativeDisplay, convertAmountToBalanceDisplay } from '@/helpers/utilities';
import { ethereumUtils } from '@/utils';

/**
 * @desc parse transactions from native prices
 * @param  {Object} [txDetails=null]
 * @param  {Object} [nativeCurrency='']
 * @return {String}
 */
export const parseNewTransaction = async (
  txDetails: NewTransactionOrAddCashTransaction,
  nativeCurrency: NativeCurrencyKey
): Promise<RainbowTransaction> => {
  let balance = null;
  const {
    amount,
    asset,
    data,
    from,
    flashbots,
    ensCommitRegistrationName,
    ensRegistration,
    gasLimit,
    gasPrice,
    maxFeePerGas,
    maxPriorityFeePerGas,
    network,
    nft,
    nonce,
    hash,
    protocol,
    sourceAmount,
    status,
    to,
    transferId,
    type,
    txTo,
    value,
    swap,
  } = txDetails;

  if (amount && asset) {
    balance = {
      amount,
      display: convertAmountToBalanceDisplay(amount, asset),
    };
  }

  const assetPrice = asset?.price?.value ?? ethereumUtils.getAssetPrice(asset?.address);

  const native =
    network && isL2Network(network)
      ? { amount: '', display: '' }
      : convertAmountAndPriceToNativeDisplay(amount ?? 0, assetPrice, nativeCurrency);

  return {
    address: asset?.address ?? ETH_ADDRESS,
    balance,
    data,
    ensCommitRegistrationName,
    ensRegistration,
    flashbots,
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
    nft,
    nonce,
    protocol,
    sourceAmount,
    status,
    symbol: asset?.symbol ?? null,
    title: `${type}.${status}`,
    to,
    transferId,
    txTo: txTo || to,
    type,
    value,
    swap,
  };
};
