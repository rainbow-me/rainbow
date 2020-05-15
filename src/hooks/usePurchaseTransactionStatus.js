import { find } from 'lodash';
import { useMemo } from 'react';
import { useSelector } from 'react-redux';

export default function usePurchaseTransactionStatus(transferId) {
  const { purchaseTransactions } = useSelector(
    ({ addCash: { purchaseTransactions } }) => ({
      purchaseTransactions,
    })
  );

  const transferStatus = useMemo(() => {
    if (!transferId) return null;
    const purchase = find(
      purchaseTransactions,
      txn => txn.transferId === transferId
    );
    return purchase ? purchase.status : null;
  }, [purchaseTransactions, transferId]);

  return transferStatus;
}
