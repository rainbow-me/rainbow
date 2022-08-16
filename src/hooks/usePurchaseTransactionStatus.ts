import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { AppState } from '@rainbow-me/redux/store';

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
    }: AppState) => ({
      currentOrderStatus,
      currentTransferId,
      error,
      purchaseTransactions,
    })
  );

  const transferStatus = useMemo(() => {
    if (!currentTransferId) return null;
    const purchase = purchaseTransactions.find(
      (txn: any) => txn.transferId === currentTransferId
    );
    return purchase ? purchase.status : null;
  }, [purchaseTransactions, currentTransferId]);

  return {
    error,
    orderStatus: currentOrderStatus,
    transferStatus,
  };
}
