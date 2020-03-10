import { captureMessage } from '@sentry/react-native';
import { isEmpty, toLower } from 'lodash';
import { useCallback, useState } from 'react';
import { useDispatch } from 'react-redux';
import {
  requestWyreApplePay,
  trackWyreOrder,
  trackWyreTransfer,
} from '../handlers/wyre';
import TransactionStatusTypes from '../helpers/transactionStatusTypes';
import TransactionTypes from '../helpers/transactionTypes';
import {
  WYRE_ORDER_STATUS_TYPES,
  WYRE_TRANSFER_STATUS_TYPES,
} from '../helpers/wyreStatusTypes';
import { dataAddNewPurchaseTransaction } from '../redux/data';
import { AddCashCurrencies, AddCashCurrencyInfo } from '../references';
import { ethereumUtils } from '../utils';
import useAccountData from './useAccountData';
import useTimeout from './useTimeout';

export default function useWyreApplePay() {
  const { accountAddress, assets, network } = useAccountData();

  const [isPaymentComplete, setPaymentComplete] = useState(false);
  const [orderCurrency, setOrderCurrency] = useState(null);
  const [orderStatus, setOrderStatus] = useState(null);
  const [transferHash, setTransferHash] = useState(null);
  const [transferStatus, setTransferStatus] = useState(null);

  const dispatch = useDispatch();

  const [retryOrderStatusTimeout] = useTimeout();
  const [retryTransferHashTimeout] = useTimeout();
  const [retryTransferStatusTimeout] = useTimeout();
  const [startPaymentCompleteTimeout] = useTimeout();

  const handlePaymentCallback = useCallback(() => {
    // In order to have the UI appear to be in-sync with the Apple Pay modal's
    // animation, we need to artificially delay before marking a purchase as pending.
    captureMessage('Wyre handle payment callback');
    startPaymentCompleteTimeout(() => setPaymentComplete(true), 1500);
  }, [startPaymentCompleteTimeout]);

  const getTransferHash = useCallback(
    async transferId => {
      const retry = () => getTransferHash(transferId);

      try {
        const {
          destAmount,
          destCurrency,
          transferHash,
          transferStatus,
        } = await trackWyreTransfer(transferId);

        setTransferStatus(transferStatus);
        const destAssetAddress = toLower(
          AddCashCurrencies[network][destCurrency]
        );

        if (transferHash) {
          setTransferHash(transferHash);
          let asset = ethereumUtils.getAsset(assets, destAssetAddress);
          if (!asset) {
            asset = AddCashCurrencyInfo[network][destAssetAddress];
          }
          const txDetails = {
            amount: destAmount,
            asset,
            from: null,
            hash: transferHash,
            nonce: null,
            status: TransactionStatusTypes.purchasing,
            to: accountAddress,
            type: TransactionTypes.purchase,
          };
          dispatch(dataAddNewPurchaseTransaction(txDetails));
          getTransferStatus(transferId);
        } else {
          retryTransferHashTimeout(retry, 1000);
        }
      } catch (error) {
        retryTransferHashTimeout(retry, 1000);
      }
    },
    [
      accountAddress,
      assets,
      dispatch,
      getTransferStatus,
      network,
      retryTransferHashTimeout,
    ]
  );

  const getTransferStatus = useCallback(
    async transferId => {
      const retry = () => getTransferStatus(transferId);

      try {
        const { transferStatus } = await trackWyreTransfer(transferId);
        setTransferStatus(transferStatus);
        if (
          transferStatus === WYRE_TRANSFER_STATUS_TYPES.success ||
          transferStatus === WYRE_TRANSFER_STATUS_TYPES.failed
        ) {
          setTransferHash(transferHash);
          setTransferStatus(transferStatus);
        } else {
          retryTransferStatusTimeout(retry, 10000);
        }
      } catch (error) {
        retryTransferStatusTimeout(retry, 1000);
      }
    },
    [retryTransferStatusTimeout, transferHash]
  );

  const getOrderStatus = useCallback(
    async (destCurrency, orderId, paymentResponse) => {
      const retry = () =>
        getOrderStatus(destCurrency, orderId, paymentResponse);

      try {
        if (!isPaymentComplete && isEmpty(orderId)) {
          paymentResponse.complete('failure');
          handlePaymentCallback();
        }

        setOrderCurrency(destCurrency);

        const { orderStatus, transferId } = await trackWyreOrder(orderId);
        setOrderStatus(orderStatus);

        const isFailed = orderStatus === WYRE_ORDER_STATUS_TYPES.failed;
        const isPending = orderStatus === WYRE_ORDER_STATUS_TYPES.pending;
        const isSuccess = orderStatus === WYRE_ORDER_STATUS_TYPES.success;

        if (!isPaymentComplete) {
          if (isFailed) {
            paymentResponse.complete('failed');
            handlePaymentCallback();
          } else if (isPending || isSuccess) {
            paymentResponse.complete('success');
            handlePaymentCallback();
          }
        }

        if (transferId) {
          getTransferHash(transferId);
        } else if (!isFailed) {
          retryOrderStatusTimeout(retry, 1000);
        }
      } catch (error) {
        retryOrderStatusTimeout(retry, 1000);
      }
    },
    [
      isPaymentComplete,
      getTransferHash,
      handlePaymentCallback,
      retryOrderStatusTimeout,
    ]
  );

  const onPurchase = useCallback(
    ({ currency, value }) => {
      return requestWyreApplePay(
        accountAddress,
        currency,
        value,
        getOrderStatus
      );
    },
    [accountAddress, getOrderStatus]
  );

  return {
    isPaymentComplete,
    onPurchase,
    orderCurrency,
    orderStatus,
    transferHash,
    transferStatus,
  };
}
