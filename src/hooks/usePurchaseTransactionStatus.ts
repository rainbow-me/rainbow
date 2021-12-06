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
      // @ts-expect-error ts-migrate(2339) FIXME: Property 'addCash' does not exist on type 'Default... Remove this comment to see the full error message
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
