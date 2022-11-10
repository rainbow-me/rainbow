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
import { logger, RainbowError } from '@/logger';

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

  const wyreAuthenticationFlowCallback = useCallback(() => {
    logger.info(`useWyreApplePay: wyreAuthenticationFlowCallback called`);

    if (!addCashGetOrderStatusPayload.current.length) {
      logger.error(
        new RainbowError(
          `useWyreApplePay: wyreAuthenticationFlowCallback was called, but no addCashGetOrderStatusPayload exists`
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

    dispatch(
      addCashGetOrderStatus(
        referenceInfo,
        currency,
        orderId,
        applePayResponse,
        value
      )
    );

    handlePaymentCallback();

    logger.info(`useWyreApplePay: wyreAuthenticationFlowCallback completed`);
  }, [
    addCashGetOrderStatusPayload,
    dispatch,
    addCashGetOrderStatus,
    handlePaymentCallback,
  ]);

  const wyreAuthenticationFlowFailureCallback = useCallback(
    (props: {
      errorCategory: string;
      errorCode: string;
      errorMessage: string;
    }) => {
      logger.info(
        `useWyreApplePay: wyreAuthenticationFlowFailureCallback called`
      );

      // reset values
      setOrderId(null);
      setWyreAuthenticationUrl('');
      addCashGetOrderStatusPayload.current = [];

      handlePaymentCallback();

      analytics.track('Purchase failed', {
        category: 'add cash',
        error_category: props.errorCategory,
        error_code: props.errorCode,
        error_message: props.errorMessage,
      });

      dispatch(
        addCashOrderCreationFailure({
          errorCategory: props.errorCategory,
          errorCode: props.errorCode,
          errorMessage: props.errorMessage,
        })
      );

      logger.info(
        `useWyreApplePay: wyreAuthenticationFlowFailureCallback completed`
      );
    },
    [
      addCashGetOrderStatusPayload,
      dispatch,
      addCashOrderCreationFailure,
      handlePaymentCallback,
    ]
  );

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

        logger.error(
          new RainbowError(`useWyreApplePay: Wyre order reservation incomplete`)
        );

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

        logger.error(
          new RainbowError(`useWyreApplePay: Wyre order quote incomplete`)
        );

        return;
      }

      const { sourceAmountWithFees, purchaseFee } = quotation;

      logger.info(`useWyreApplePay: showing Apple Pay request`);

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
        logger.info(
          `useWyreApplePay: Apple Pay request returned response, running getWyreWalletOrder`
        );

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
          logger.info(
            `useWyreApplePay: getWyreWalletOrder returned an orderId`
          );

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

          // show feedback to user immediately
          applePayResponse.complete(PaymentRequestStatusTypes.SUCCESS);

          // artificial timeout to allow for Apple Pay to complete
          setTimeout(() => {
            if (authenticationUrl) {
              setWyreAuthenticationUrl(authenticationUrl);
              logger.info(
                `useWyreApplePay: setWyreAuthenticationUrl and defer to auth`
              );
            } else {
              wyreAuthenticationFlowCallback();
              logger.info(
                `useWyreApplePay: no authenticationUrl returned, continue as normal`
              );
            }
          }, 1_500);

          logger.info(`useWyreApplePay: onPurchase finished`);
        } else {
          logger.info(
            `useWyreApplePay: getWyreWalletOrder did not return an orderId`
          );

          // show feedback to user immediately
          applePayResponse.complete(PaymentRequestStatusTypes.FAIL);

          wyreAuthenticationFlowFailureCallback({
            errorCategory,
            errorCode,
            errorMessage,
          });

          logger.error(new RainbowError(`useWyreApplePay: onPurchase failed`));
        }
      } else {
        logger.info(
          `useWyreApplePay: Apple Pay request did NOT return a response`
        );

        analytics.track('Purchase incomplete', {
          category: 'add cash',
        });

        wyreAuthenticationFlowFailureCallback({
          errorCategory: 'Timeout',
          errorCode: 'Timeout',
          errorMessage: 'Timeout',
        });

        logger.error(new RainbowError(`useWyreApplePay: onPurchase failed`));
      }
    },
    [
      accountAddress,
      dispatch,
      handlePaymentCallback,
      network,
      setWyreAuthenticationUrl,
      wyreAuthenticationFlowCallback,
    ]
  );

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
