import { isEmpty, toLower } from 'lodash';
import { useCallback, useEffect, useRef, useState } from 'react';
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

export default function useWyreApplePay() {
  const { accountAddress, assets } = useAccountData();

  const [orderCurrency, setOrderCurrency] = useState(null);
  const [orderStatus, setOrderStatus] = useState(null);
  const [transferHash, setTransferHash] = useState(null);
  const [transferStatus, setTransferStatus] = useState(null);

  const [completedPaymentResponse, setCompletedPaymentResponse] = useState(
    false
  );

  const transferStatusTimeout = useRef();
  const orderStatusTimeout = useRef();
  const transferHashTimeout = useRef();

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
        const destAssetAddress = toLower(AddCashCurrencies[destCurrency]);

        if (transferHash) {
          setTransferHash(transferHash);
          let asset = ethereumUtils.getAsset(assets, destAssetAddress);
          if (!asset) {
            asset = AddCashCurrencyInfo[destAssetAddress];
            // TODO JIN fetch the price
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
          dataAddNewPurchaseTransaction(txDetails);
          getTransferStatus(transferId);
        } else {
          transferHashTimeout.current = setTimeout(retry, 1000);
        }
      } catch (error) {
        transferHashTimeout.current = setTimeout(retry, 1000);
      }
    },
    [accountAddress, assets, getTransferStatus]
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
          transferStatusTimeout.current = setTimeout(retry, 10000);
        }
      } catch (error) {
        transferStatusTimeout.current = setTimeout(retry, 1000);
      }
    },
    [transferHash]
  );

  const getOrderStatus = useCallback(
    async (destCurrency, orderId, paymentResponse) => {
      const retry = () =>
        getOrderStatus(destCurrency, orderId, paymentResponse);

      try {
        if (!completedPaymentResponse && isEmpty(orderId)) {
          paymentResponse.complete('failure');
          setCompletedPaymentResponse(true);
        }

        setOrderCurrency(destCurrency);

        const { orderStatus, transferId } = await trackWyreOrder(orderId);
        setOrderStatus(orderStatus);

        const isFailed = orderStatus === WYRE_ORDER_STATUS_TYPES.failed;
        const isPending = orderStatus === WYRE_ORDER_STATUS_TYPES.pending;
        const isSuccess = orderStatus === WYRE_ORDER_STATUS_TYPES.success;

        if (!completedPaymentResponse) {
          if (isFailed) {
            paymentResponse.complete('failed');
            setCompletedPaymentResponse(true);
          } else if (isPending || isSuccess) {
            paymentResponse.complete('success');
            setCompletedPaymentResponse(true);
          }
        }

        if (transferId) {
          getTransferHash(transferId);
        } else if (!isFailed) {
          orderStatusTimeout.current = setTimeout(retry, 1000);
        }
      } catch (error) {
        orderStatusTimeout.current = setTimeout(retry, 1000);
      }
    },
    [completedPaymentResponse, getTransferHash]
  );

  // Clear  timeouts
  useEffect(
    () => () => {
      if (orderStatusTimeout.current) {
        clearTimeout(orderStatusTimeout.current);
      }
      if (transferHashTimeout.current) {
        clearTimeout(transferHashTimeout.current);
      }
      if (transferStatusTimeout.current) {
        clearTimeout(transferStatusTimeout.current);
      }
    },
    []
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
    onPurchase,
    orderCurrency,
    orderStatus,
    transferHash,
    transferStatus,
  };
}
