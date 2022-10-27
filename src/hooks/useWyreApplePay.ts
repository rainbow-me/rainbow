import { useCallback, useEffect, useState, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { Alert } from '../components/alerts';
import {
  getWyreWalletOrder,
  getReferenceId,
  getWalletOrderQuotation,
  PaymentRequestStatusTypes,
  reserveWyreOrder,
  showApplePayRequest,
} from '../handlers/wyre';
import {
  addCashGetOrderStatus,
  addCashOrderCreationFailure,
  addCashResetCurrentOrder,
} from '../redux/addCash';
import useAccountSettings from './useAccountSettings';
import usePurchaseTransactionStatus from './usePurchaseTransactionStatus';
import useTimeout from './useTimeout';
import { analytics } from '@/analytics';
import { getTokenMetadata } from '@/utils';
import logger from '@/utils/logger';
import { logger as loggr, RainbowError } from '@/logger';

export default function useWyreApplePay() {
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(addCashResetCurrentOrder());
  }, [dispatch]);

  const { accountAddress, network } = useAccountSettings();

  const [isPaymentComplete, setPaymentComplete] = useState(false);
  const [orderCurrency, setOrderCurrency] = useState(null);
  const [orderId, setOrderId] = useState(null);
  const addCashGetOrderStatusPayload = useRef<any[]>([]);
  const [wyreAuthenticationUrl, setWyreAuthenticationUrl] = useState('');

  const { error, orderStatus, transferStatus } = usePurchaseTransactionStatus();

  const [startPaymentCompleteTimeout] = useTimeout();

  const resetAddCashForm = useCallback(() => {
    dispatch(addCashResetCurrentOrder());
    setPaymentComplete(false);
  }, [dispatch]);

  const handlePaymentCallback = useCallback(() => {
    // In order to have the UI appear to be in-sync with the Apple Pay modal's
    // animation, we need to artificially delay before marking a purchase as pending.
    startPaymentCompleteTimeout(() => setPaymentComplete(true), 1500);
  }, [startPaymentCompleteTimeout]);

  const onPurchase = useCallback(
    async ({ address, value }) => {
      const metadata = getTokenMetadata(address);
      const currency = metadata?.symbol;

      const referenceInfo = {
        referenceId: getReferenceId(accountAddress),
      };
      const { reservation: reservationId } = await reserveWyreOrder(
        value,
        currency,
        accountAddress,
        network
      );

      if (!reservationId) {
        analytics.track('Wyre order reservation incomplete', {
          category: 'add cash',
        });
        Alert({
          buttons: [{ text: 'Okay' }],
          message:
            'We were unable to reserve your purchase order. Please try again later.',
          title: `Something went wrong!`,
        });
        return;
      }
      const quotation = await getWalletOrderQuotation(
        value,
        currency,
        accountAddress,
        network
      );

      if (!quotation) {
        analytics.track('Wyre order quote incomplete', {
          category: 'add cash',
        });
        Alert({
          buttons: [{ text: 'Okay' }],
          message:
            'We were unable to get a quote on your purchase order. Please try again later.',
          title: `Something went wrong!`,
        });
        return;
      }

      const { sourceAmountWithFees, purchaseFee } = quotation;

      const applePayResponse = await showApplePayRequest(
        referenceInfo,
        accountAddress,
        currency,
        sourceAmountWithFees,
        purchaseFee,
        value,
        network
      );

      // @ts-expect-error ts-migrate(2345) FIXME: Argument of type 'string | undefined' is not assig... Remove this comment to see the full error message
      setOrderCurrency(currency);

      if (applePayResponse) {
        logger.log('[add cash] - get order id');
        const {
          orderId,
          authenticationUrl,
          errorCategory,
          errorCode,
          errorMessage,
        } = await getWyreWalletOrder(
          referenceInfo,
          applePayResponse,
          sourceAmountWithFees,
          accountAddress,
          currency,
          network,
          reservationId
        );
        if (orderId) {
          setOrderId(orderId);

          // @ts-expect-error ts-migrate(2339) FIXME: Property 'orderId' does not exist on type '{ refer... Remove this comment to see the full error message
          referenceInfo.orderId = orderId;

          addCashGetOrderStatusPayload.current = [
            referenceInfo,
            currency,
            orderId,
            applePayResponse,
            value,
          ];

          setWyreAuthenticationUrl(authenticationUrl);
        } else {
          dispatch(
            addCashOrderCreationFailure({
              errorCategory,
              errorCode,
              errorMessage,
            })
          );
          applePayResponse.complete(PaymentRequestStatusTypes.FAIL);
          handlePaymentCallback();
          analytics.track('Purchase failed', {
            category: 'add cash',
            error_category: errorCategory,
            error_code: errorCode,
            error_message: errorMessage,
          });
        }
      } else {
        analytics.track('Purchase incomplete', {
          category: 'add cash',
        });
      }
    },
    [accountAddress, dispatch, handlePaymentCallback, network]
  );

  const wyreAuthenticationFlowCallback = useCallback(() => {
    if (!addCashGetOrderStatusPayload.current.length) {
      loggr.error(
        new RainbowError(
          `wyreAuthenticationFlowCallback was called, but no addCashGetOrderStatusPayload exists`
        )
      );
      return;
    }

    const [
      referenceInfo,
      currency,
      orderId,
      applePayResponse,
      value,
    ] = addCashGetOrderStatusPayload.current;

    applePayResponse.complete(PaymentRequestStatusTypes.SUCCESS);

    handlePaymentCallback();

    dispatch(
      addCashGetOrderStatus(
        referenceInfo,
        currency,
        orderId,
        applePayResponse,
        value
      )
    );
  }, [
    addCashGetOrderStatusPayload,
    dispatch,
    addCashGetOrderStatus,
    handlePaymentCallback,
  ]);

  const wyreAuthenticationFlowFailureCallback = useCallback(() => {
    if (!addCashGetOrderStatusPayload.current.length) {
      loggr.error(
        new RainbowError(
          `wyreAuthenticationFlowFailureCallback was called, but no addCashGetOrderStatusPayload exists`
        )
      );
      return;
    }

    const [
      referenceInfo,
      currency,
      orderId,
      applePayResponse,
      value,
    ] = addCashGetOrderStatusPayload.current;

    applePayResponse.complete(PaymentRequestStatusTypes.FAIL);

    // reset values
    setOrderId(null);
    setWyreAuthenticationUrl('');
    addCashGetOrderStatusPayload.current = [];

    handlePaymentCallback();

    // TODO Do we need this?
    // dispatch(
    //   addCashOrderCreationFailure({
    //     errorCategory,
    //     errorCode,
    //     errorMessage,
    //   })
    // );
  }, [
    addCashGetOrderStatusPayload,
    dispatch,
    addCashOrderCreationFailure,
    handlePaymentCallback,
  ]);

  return {
    error,
    isPaymentComplete,
    onPurchase,
    orderCurrency,
    orderId,
    orderStatus,
    resetAddCashForm,
    transferStatus,
    wyreAuthenticationFlowCallback,
    wyreAuthenticationFlowFailureCallback,
    wyreAuthenticationUrl,
  };
}
