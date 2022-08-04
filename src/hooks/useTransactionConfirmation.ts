import { dataAddNewTransaction } from '../redux/data';
import { removeRequest } from '../redux/requests';
import { walletConnectSendStatus } from '../redux/walletconnect';

export default function useTransactionConfirmation() {
  return {
    dataAddNewTransaction,
    removeRequest,
    walletConnectSendStatus,
  };
}
