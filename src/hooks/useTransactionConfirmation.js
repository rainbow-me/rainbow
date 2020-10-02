import { dataAddNewTransaction } from '../redux/data';
import { updateTransactionCountNonce } from '../redux/nonce';
import { removeRequest } from '../redux/requests';
import { walletConnectSendStatus } from '../redux/walletconnect';
import { useSelector } from '@rainbow-me/react-redux';

export default function useTransactionConfirmation() {
  const { transactionCountNonce } = useSelector(
    ({ nonce: { transactionCountNonce } }) => ({
      transactionCountNonce,
    })
  );
  return {
    dataAddNewTransaction,
    removeRequest,
    transactionCountNonce,
    updateTransactionCountNonce,
    walletConnectSendStatus,
  };
}
