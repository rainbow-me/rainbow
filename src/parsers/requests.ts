import { convertHexToUtf8 } from '@walletconnect/utils';
import BigNumber from 'bignumber.js';
import { get, isNil } from 'lodash';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/handlers/web3' or ... Remove this comment to see the full error message
import { isHexString } from '@rainbow-me/handlers/web3';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/redux/store' or it... Remove this comment to see the full error message
import store from '@rainbow-me/redux/store';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/references' or its... Remove this comment to see the full error message
import { ethUnits, smartContractMethods } from '@rainbow-me/references';
import {
  convertAmountAndPriceToNativeDisplay,
  convertHexToString,
  convertRawAmountToDecimalFormat,
  fromWei,
  // @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/utilities' or its ... Remove this comment to see the full error message
} from '@rainbow-me/utilities';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/utils' or its corr... Remove this comment to see the full error message
import { ethereumUtils } from '@rainbow-me/utils';
import {
  PERSONAL_SIGN,
  SEND_TRANSACTION,
  SIGN,
  SIGN_TRANSACTION,
  SIGN_TYPED_DATA,
  // @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/utils/signingMetho... Remove this comment to see the full error message
} from '@rainbow-me/utils/signingMethods';

export const getRequestDisplayDetails = (
  payload: any,
  nativeCurrency: any,
  dappNetwork: any
) => {
  let timestampInMs = Date.now();
  if (payload.id) {
    timestampInMs = getTimestampFromPayload(payload);
  }
  if (
    payload.method === SEND_TRANSACTION ||
    payload.method === SIGN_TRANSACTION
  ) {
    const transaction = get(payload, 'params[0]', null);

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
    const message = get(payload, 'params[1]');
    const result = getMessageDisplayDetails(message, timestampInMs);
    return result;
  }
  if (payload.method === PERSONAL_SIGN) {
    let message = get(payload, 'params[0]');
    try {
      if (isHexString(message)) {
        message = convertHexToUtf8(message);
      }
    } catch (error) {
      // TODO error handling
    }
    return getMessageDisplayDetails(message, timestampInMs);
  }

  // There's a lot of inconsistency in the parameter order for this method
  // due to changing EIP-712 spec
  // (eth_signTypedData => eth_signTypedData_v3 => eth_signTypedData_v4)
  // Aside from expecting the address as the first parameter
  // and data as the second one it's safer to verify that
  // and switch order if needed to ensure max compatibility with dapps
  if (payload.method === SIGN_TYPED_DATA) {
    if (payload.params.length && payload.params[0]) {
      let data = get(payload, 'params[0]', null);
      if (ethereumUtils.isEthAddress(get(payload, 'params[0]', ''))) {
        data = get(payload, 'params[1]', null);
      }
      return getMessageDisplayDetails(data, timestampInMs);
    }
  }
  return {};
};

// @ts-expect-error ts-migrate(7006) FIXME: Parameter 'message' implicitly has an 'any' type.
const getMessageDisplayDetails = (message, timestampInMs) => ({
  request: message,
  timestampInMs,
});

const getTransactionDisplayDetails = (
  transaction: any,
  nativeCurrency: any,
  timestampInMs: any,
  dappNetwork: any
) => {
  const tokenTransferHash = smartContractMethods.token_transfer.hash;
  const nativeAsset = ethereumUtils.getNativeAssetForNetwork(dappNetwork);
  if (transaction.data === '0x') {
    const value = fromWei(convertHexToString(transaction.value));
    const priceUnit = get(nativeAsset, 'price.value', 0);
    const { amount, display } = convertAmountAndPriceToNativeDisplay(
      value,
      priceUnit,
      nativeCurrency
    );
    return {
      request: {
        asset: nativeAsset,
        from: transaction.from,
        // @ts-expect-error ts-migrate(2348) FIXME: Value of type 'typeof BigNumber' is not callable. ... Remove this comment to see the full error message
        gasLimit: BigNumber(convertHexToString(transaction.gasLimit)),
        // @ts-expect-error ts-migrate(2348) FIXME: Value of type 'typeof BigNumber' is not callable. ... Remove this comment to see the full error message
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
    const { assets } = store.getState().data;
    const contractAddress = transaction.to;
    const asset = ethereumUtils.getAsset(assets, contractAddress);
    const dataPayload = transaction.data.replace(tokenTransferHash, '');
    const toAddress = `0x${dataPayload.slice(0, 64).replace(/^0+/, '')}`;
    const amount = `0x${dataPayload.slice(64, 128).replace(/^0+/, '')}`;
    const value = convertRawAmountToDecimalFormat(
      convertHexToString(amount),
      asset.decimals
    );
    const priceUnit = get(asset, 'price.value', 0);
    const native = convertAmountAndPriceToNativeDisplay(
      value,
      priceUnit,
      nativeCurrency
    );
    return {
      request: {
        asset,
        from: transaction.from,
        // @ts-expect-error ts-migrate(2348) FIXME: Value of type 'typeof BigNumber' is not callable. ... Remove this comment to see the full error message
        gasLimit: BigNumber(convertHexToString(transaction.gasLimit)),
        // @ts-expect-error ts-migrate(2348) FIXME: Value of type 'typeof BigNumber' is not callable. ... Remove this comment to see the full error message
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
        // @ts-expect-error ts-migrate(2348) FIXME: Value of type 'typeof BigNumber' is not callable. ... Remove this comment to see the full error message
        gasLimit: BigNumber(convertHexToString(transaction.gasLimit)),
        // @ts-expect-error ts-migrate(2348) FIXME: Value of type 'typeof BigNumber' is not callable. ... Remove this comment to see the full error message
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

const getTimestampFromPayload = (payload: any) =>
  parseInt(payload?.id.toString().slice(0, -3), 10);
