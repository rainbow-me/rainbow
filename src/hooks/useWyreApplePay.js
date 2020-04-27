import analytics from '@segment/analytics-react-native';
import { captureException, captureMessage } from '@sentry/react-native';
import { get, toLower } from 'lodash';
import { useCallback, useState } from 'react';
import { useDispatch } from 'react-redux';
import {
  getOrderId,
  getReferenceId,
  showApplePayRequest,
  trackWyreOrder,
  trackWyreTransfer,
} from '../handlers/wyre';
import TransactionStatusTypes from '../helpers/transactionStatusTypes';
import TransactionTypes from '../helpers/transactionTypes';
import {
  WYRE_ORDER_STATUS_TYPES,
  WYRE_TRANSFER_STATUS_TYPES,
} from '../helpers/wyreStatusTypes';
import { addCashNewPurchaseTransaction } from '../redux/addCash';
import { dataAddNewTransaction } from '../redux/data';
import { AddCashCurrencies, AddCashCurrencyInfo } from '../references';
import { ethereumUtils, logger } from '../utils';
import useAccountAssets from './useAccountAssets';
import useAccountSettings from './useAccountSettings';
import useTimeout from './useTimeout';

export default function useWyreApplePay() {
  const { accountAddress, network } = useAccountSettings();
  const { assets } = useAccountAssets();

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
    startPaymentCompleteTimeout(() => setPaymentComplete(true), 1500);
  }, [startPaymentCompleteTimeout]);

  const getTransferStatus = useCallback(
    async (referenceInfo, transferId) => {
      const retry = () => getTransferStatus(referenceInfo, transferId);

      try {
        const { transferStatus } = await trackWyreTransfer(
          referenceInfo,
          transferId
        );
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

  const getTransferHash = useCallback(
    async (referenceInfo, transferId, sourceAmount) => {
      const retry = () =>
        getTransferHash(referenceInfo, transferId, sourceAmount);

      try {
        const {
          destAmount,
          destCurrency,
          transferHash,
          transferStatus,
        } = await trackWyreTransfer(referenceInfo, transferId);

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
            sourceAmount,
            status: TransactionStatusTypes.purchasing,
            timestamp: Date.now(),
            to: accountAddress,
            type: TransactionTypes.purchase,
          };
          dispatch(addCashNewPurchaseTransaction(txDetails));
          dispatch(dataAddNewTransaction(txDetails));
          getTransferStatus(referenceInfo, transferId);
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

  const getOrderStatus = useCallback(
    async (
      referenceInfo,
      destCurrency,
      orderId,
      paymentResponse,
      sourceAmount
    ) => {
      const retry = () =>
        getOrderStatus(
          referenceInfo,
          destCurrency,
          orderId,
          paymentResponse,
          sourceAmount
        );

      try {
        const { data, orderStatus, transferId } = await trackWyreOrder(
          referenceInfo,
          orderId
        );
        setOrderStatus(orderStatus);

        const isFailed = orderStatus === WYRE_ORDER_STATUS_TYPES.failed;
        const isPending = orderStatus === WYRE_ORDER_STATUS_TYPES.pending;
        const isSuccess = orderStatus === WYRE_ORDER_STATUS_TYPES.success;
        const isChecking = orderStatus === WYRE_ORDER_STATUS_TYPES.checking;

        if (!isPaymentComplete) {
          if (isFailed) {
            logger.sentry('Wyre order data failed', data);
            captureMessage(
              `Wyre final check - order status failed - ${referenceInfo.referenceId}`
            );
            analytics.track('Purchase failed', {
              category: 'add cash',
              error_category: get(data, 'errorCategory', 'unknown'),
              error_code: get(data, 'errorCode', 'unknown'),
            });
            paymentResponse.complete('fail');
            handlePaymentCallback();
          } else if (isPending || isSuccess) {
            analytics.track('Purchase completed', {
              category: 'add cash',
            });
            paymentResponse.complete('success');
            handlePaymentCallback();
          } else if (!isChecking) {
            logger.sentry('Wyre order data', data);
            captureMessage(
              `Wyre final check - order status unknown - ${referenceInfo.referenceId}`
            );
          }
        }

        if (transferId) {
          referenceInfo.transferId = transferId;
          getTransferHash(referenceInfo, transferId, sourceAmount);
        } else if (!isFailed) {
          retryOrderStatusTimeout(retry, 1000);
        }
      } catch (error) {
        captureException(error);
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
    async ({ currency, value }) => {
      const referenceInfo = {
        referenceId: getReferenceId(accountAddress),
      };

      const applePayResponse = await showApplePayRequest(
        referenceInfo,
        accountAddress,
        currency,
        value
      );

      setOrderCurrency(currency);

      if (applePayResponse) {
        const { paymentResponse, totalAmount } = applePayResponse;
        const orderId = await getOrderId(
          referenceInfo,
          paymentResponse,
          totalAmount,
          accountAddress,
          currency
        );
        if (orderId) {
          referenceInfo.orderId = orderId;
          getOrderStatus(
            referenceInfo,
            currency,
            orderId,
            paymentResponse,
            value
          );
        } else {
          analytics.track('Purchase failed', {
            category: 'add cash',
            error_category: 'EARLY_FAILURE',
            error_code: 'NO_ORDER_ID',
          });
          paymentResponse.complete('fail');
          handlePaymentCallback();
        }
      }
    },
    [accountAddress, getOrderStatus, handlePaymentCallback]
  );

  return {
    isPaymentComplete,
    onPurchase,
    orderCurrency,
    orderStatus,
    transferStatus,
  };
}
