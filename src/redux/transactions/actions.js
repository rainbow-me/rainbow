import createActionCreator from '../../utils/createActionCreator';

export const SEND_TRANSACTION = 'transactions/SEND_TRANSACTION';
export const SEND_TRANSACTION_RESULT = 'transactions/SEND_TRANSACTION_RESULT';

export const sendTransactionResult = createActionCreator(SEND_TRANSACTION_RESULT);

export function sendTransaction() {

}

export default {
  SEND_TRANSACTION,
  SEND_TRANSACTION_RESULT,
  sendTransactionResult,
  sendTransaction,
};
