import { getDescription, getTitle } from './transactions';
import {
  NativeCurrencyKey,
  NewTransactionOrAddCashTransaction,
  RainbowTransaction,
  TransactionStatus,
  TransactionType,
} from '@/entities';
import { isL2Network } from '@/handlers/web3';
import { ETH_ADDRESS } from '@/references';
import {
  convertAmountAndPriceToNativeDisplay,
  convertAmountToBalanceDisplay,
} from '@/helpers/utilities';
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
    dappName,
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
    hash: txHash,
    protocol,
    sourceAmount,
    status: txStatus,
    to,
    transferId,
    type: txType,
    txTo,
    value,
    swap,
    fiatProvider,
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

  const nftName =
    type === TransactionType.authorize ? nft?.collection.name : nft?.name;

  const description = getDescription({
    name: nftName ?? asset?.name ?? null,
    status,
    type,
  });

  return {
    address: asset?.address ?? ETH_ADDRESS,
    balance,
    dappName,
    data,
    description,
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
    swap,
    fiatProvider,
  };
};
