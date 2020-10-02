import { find } from 'lodash';
import { useMemo } from 'react';
import { useSelector } from 'react-redux';

export default function usePurchaseTransactionStatus() {
  const {
    currentOrderStatus,
    currentTransferId,
    error,
    purchaseTransactions,
  } = useSelector(
    ({
      addCash: {
        currentOrderStatus,
        currentTransferId,
        error,
        purchaseTransactions,
      },
    }) => ({
      currentOrderStatus,
      currentTransferId,
      error,
      purchaseTransactions,
    })
  );

  const transferStatus = useMemo(() => {
    if (!currentTransferId) return null;
    const purchase = find(
      purchaseTransactions,
      txn => txn.transferId === currentTransferId
    );
    return purchase ? purchase.status : null;
  }, [purchaseTransactions, currentTransferId]);

  return {
    error,
    orderStatus: currentOrderStatus,
    transferStatus,
  };
}
