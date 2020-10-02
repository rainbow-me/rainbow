import { useSelector } from 'react-redux';
import { dataAddNewTransaction } from '../redux/data';
import { updateTransactionCountNonce } from '../redux/nonce';
import { removeRequest } from '../redux/requests';
import { walletConnectSendStatus } from '../redux/walletconnect';

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
