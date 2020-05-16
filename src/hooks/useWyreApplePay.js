import analytics from '@segment/analytics-react-native';
import { captureException, captureMessage } from '@sentry/react-native';
import { get } from 'lodash';
import { useCallback, useState } from 'react';
import { useDispatch } from 'react-redux';
import {
  getOrderId,
  getReferenceId,
  PaymentRequestStatusTypes,
  showApplePayRequest,
  trackWyreOrder,
} from '../handlers/wyre';
import { WYRE_ORDER_STATUS_TYPES } from '../helpers/wyreStatusTypes';
import { addCashGetTransferHash } from '../redux/addCash';
import { logger } from '../utils';
import useAccountSettings from './useAccountSettings';
import usePurchaseTransactionStatus from './usePurchaseTransactionStatus';
import useTimeout from './useTimeout';

export default function useWyreApplePay() {
  const { accountAddress, network } = useAccountSettings();

  const [isPaymentComplete, setPaymentComplete] = useState(false);
  const [orderCurrency, setOrderCurrency] = useState(null);
  const [orderStatus, setOrderStatus] = useState(null);
  const [transferId, setTransferId] = useState(null);

  const transferStatus = usePurchaseTransactionStatus(transferId);

  const dispatch = useDispatch();

  const [retryOrderStatusTimeout] = useTimeout();
  const [startPaymentCompleteTimeout] = useTimeout();

  const handlePaymentCallback = useCallback(() => {
    // In order to have the UI appear to be in-sync with the Apple Pay modal's
    // animation, we need to artificially delay before marking a purchase as pending.
    startPaymentCompleteTimeout(() => setPaymentComplete(true), 1500);
  }, [startPaymentCompleteTimeout]);

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
          orderId,
          network
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
          } else if (isPending || isSuccess) {
            analytics.track('Purchase completed', {
              category: 'add cash',
            });
          } else if (!isChecking) {
            logger.sentry('Wyre order data', data);
            captureMessage(
              `Wyre final check - order status unknown - ${referenceInfo.referenceId}`
            );
          }
        }

        if (transferId) {
          setTransferId(transferId);
          referenceInfo.transferId = transferId;
          dispatch(
            addCashGetTransferHash(referenceInfo, transferId, sourceAmount)
          );
        } else if (!isFailed) {
          retryOrderStatusTimeout(retry, 1000);
        }
      } catch (error) {
        captureException(error);
        retryOrderStatusTimeout(retry, 1000);
      }
    },
    [dispatch, isPaymentComplete, network, retryOrderStatusTimeout]
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
        value,
        network
      );

      setOrderCurrency(currency);

      if (applePayResponse) {
        const { paymentResponse, totalAmount } = applePayResponse;
        logger.log('[add cash] - get order id');
        const { orderId, errorCode, type } = await getOrderId(
          referenceInfo,
          paymentResponse,
          totalAmount,
          accountAddress,
          currency,
          network
        );
        if (orderId) {
          paymentResponse.complete(PaymentRequestStatusTypes.SUCCESS);
          handlePaymentCallback();
          logger.log('[add cash] - watch for order status', orderId);
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
            error_category: type,
            error_code: errorCode,
          });
          paymentResponse.complete(PaymentRequestStatusTypes.FAIL);
          handlePaymentCallback();
        }
      } else {
        analytics.track('Purchase incomplete', {
          category: 'add cash',
        });
      }
    },
    [accountAddress, getOrderStatus, handlePaymentCallback, network]
  );

  return {
    isPaymentComplete,
    onPurchase,
    orderCurrency,
    orderStatus,
    transferStatus,
  };
}
