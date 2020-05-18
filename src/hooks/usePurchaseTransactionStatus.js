import { find } from 'lodash';
import { useMemo } from 'react';
import { useSelector } from 'react-redux';

export default function usePurchaseTransactionStatus() {
  const {
    currentOrderStatus,
    currentTransferId,
    purchaseTransactions,
  } = useSelector(
    ({
      addCash: { currentOrderStatus, currentTransferId, purchaseTransactions },
    }) => ({
      currentOrderStatus,
      currentTransferId,
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
    orderStatus: currentOrderStatus,
    transferStatus,
  };
}
