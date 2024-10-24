import { useCallback } from 'react';

type UseConfirmTransactionProps = {
  isMessageRequest: boolean;
  isBalanceEnough: boolean | undefined;
  isValidGas: boolean;
  handleSignMessage: () => void;
  handleConfirmTransaction: () => void;
};

export const useConfirmTransaction = ({
  isMessageRequest,
  isBalanceEnough,
  isValidGas,
  handleSignMessage,
  handleConfirmTransaction,
}: UseConfirmTransactionProps) => {
  const onConfirm = useCallback(async () => {
    console.log('onConfirm: ', isMessageRequest, isBalanceEnough, isValidGas);
    if (isMessageRequest) {
      return handleSignMessage();
    }
    if (!isBalanceEnough || !isValidGas) return;
    return handleConfirmTransaction();
  }, [isMessageRequest, isBalanceEnough, isValidGas, handleConfirmTransaction, handleSignMessage]);

  return { onConfirm };
};
