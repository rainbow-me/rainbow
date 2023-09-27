import BigNumber from 'bignumber.js';
import { isNil } from 'lodash';
import { isHexString } from '@/handlers/web3';
import { ethUnits, smartContractMethods } from '@/references';
import {
  convertAmountAndPriceToNativeDisplay,
  convertHexToString,
  convertRawAmountToDecimalFormat,
  fromWei,
} from '@/helpers/utilities';
import { logger } from '@/logger';
import { ethereumUtils } from '@/utils';
import {
  isSignTypedData,
  PERSONAL_SIGN,
  SEND_TRANSACTION,
  SIGN,
  SIGN_TRANSACTION,
} from '@/utils/signingMethods';
import { isAddress } from '@ethersproject/address';
import { toUtf8String } from '@ethersproject/strings';

export const getRequestDisplayDetails = (
  payload,
  nativeCurrency,
  dappNetwork
) => {
  const timestampInMs = Date.now();
  if (
    payload.method === SEND_TRANSACTION ||
    payload.method === SIGN_TRANSACTION
  ) {
    const transaction = Object.assign(payload?.params?.[0] ?? null);

    // Backwards compatibility with param name change
    if (transaction.gas && !transaction.gasLimit) {
      transaction.gasLimit = transaction.gas;
    }

    // We must pass a number through the bridge
    if (!transaction.gasLimit) {
      transaction.gasLimit = ethUnits.gasLimit;
    }

    // Fallback for dapps sending no data
    if (!transaction.data) {
      transaction.data = '0x';
    }

    return getTransactionDisplayDetails(
      transaction,
      nativeCurrency,
      timestampInMs,
      dappNetwork
    );
  }
  if (payload.method === SIGN) {
    const message = payload?.params?.find(p => !isAddress(p));
    const result = getMessageDisplayDetails(message, timestampInMs);
    return result;
  }
  if (payload.method === PERSONAL_SIGN) {
    let message = payload?.params?.find(p => !isAddress(p));
    try {
      if (isHexString(message)) {
        message = toUtf8String(message);
      }
    } catch (error) {
      logger.debug(
        'WC v2: getting display details, unable to decode hex message to UTF8 string',
        {},
        logger.DebugContext.walletconnect
      );
    }
    return getMessageDisplayDetails(message, timestampInMs);
  }

  // There's a lot of inconsistency in the parameter order for this method
  // due to changing EIP-712 spec
  // (eth_signTypedData => eth_signTypedData_v3 => eth_signTypedData_v4)
  // Aside from expecting the address as the first parameter
  // and data as the second one it's safer to verify that
  // and switch order if needed to ensure max compatibility with dapps
  if (isSignTypedData(payload.method)) {
    if (payload.params.length && payload.params[0]) {
      let data = payload?.params?.[0] ?? null;
      if (ethereumUtils.isEthAddress(payload?.params?.[0] ?? '')) {
        data = payload?.params?.[1] ?? null;
      }
      return getMessageDisplayDetails(data, timestampInMs);
    }
  }
  return {};
};

const getMessageDisplayDetails = (message, timestampInMs) => ({
  request: message,
  timestampInMs,
});

const getTransactionDisplayDetails = (
  transaction,
  nativeCurrency,
  timestampInMs,
  dappNetwork
) => {
  const tokenTransferHash = smartContractMethods.token_transfer.hash;
  const nativeAsset = ethereumUtils.getNativeAssetForNetwork(dappNetwork);
  if (transaction.data === '0x') {
    const value = fromWei(convertHexToString(transaction.value));
    const priceUnit = nativeAsset?.price?.value ?? 0;
    const { amount, display } = convertAmountAndPriceToNativeDisplay(
      value,
      priceUnit,
      nativeCurrency
    );
    return {
      request: {
        asset: nativeAsset,
        from: transaction.from,
        gasLimit: BigNumber(convertHexToString(transaction.gasLimit)),
        gasPrice: BigNumber(convertHexToString(transaction.gasPrice)),
        nativeAmount: amount,
        nativeAmountDisplay: display,
        to: transaction.to,
        value,
        ...(!isNil(transaction.nonce)
          ? { nonce: Number(convertHexToString(transaction.nonce)) }
          : {}),
      },
      timestampInMs,
    };
  }
  if (transaction.data.startsWith(tokenTransferHash)) {
    const contractAddress = transaction.to;
    const accountAssetUniqueId = ethereumUtils.getUniqueId(
      contractAddress,
      dappNetwork
    );
    const asset = ethereumUtils.getAccountAsset(accountAssetUniqueId);
    const dataPayload = transaction.data.replace(tokenTransferHash, '');
    const toAddress = `0x${dataPayload.slice(0, 64).replace(/^0+/, '')}`;
    const amount = `0x${dataPayload.slice(64, 128).replace(/^0+/, '')}`;
    const value = convertRawAmountToDecimalFormat(
      convertHexToString(amount),
      asset.decimals
    );
    const priceUnit = asset?.price?.value ?? 0;
    const native = convertAmountAndPriceToNativeDisplay(
      value,
      priceUnit,
      nativeCurrency
    );
    return {
      request: {
        asset,
        from: transaction.from,
        gasLimit: BigNumber(convertHexToString(transaction.gasLimit)),
        gasPrice: BigNumber(convertHexToString(transaction.gasPrice)),
        nativeAmount: native.amount,
        nativeAmountDisplay: native.display,
        ...(!isNil(transaction.nonce)
          ? { nonce: Number(convertHexToString(transaction.nonce)) }
          : {}),
        to: toAddress,
        value,
      },
      timestampInMs,
    };
  }
  if (transaction.data) {
    // If it's not a token transfer, let's assume it's an ETH transaction
    // Once it confirmed, zerion will show the correct data
    const value = transaction.value
      ? fromWei(convertHexToString(transaction.value))
      : 0;
    return {
      request: {
        asset: nativeAsset,
        data: transaction.data,
        from: transaction.from,
        gasLimit: BigNumber(convertHexToString(transaction.gasLimit)),
        gasPrice: BigNumber(convertHexToString(transaction.gasPrice)),
        ...(!isNil(transaction.nonce)
          ? { nonce: Number(convertHexToString(transaction.nonce)) }
          : {}),
        to: transaction.to,
        value,
      },
      timestampInMs,
    };
  }

  return null;
};
