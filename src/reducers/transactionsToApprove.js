import smartContractMethods from 'balance-common/src/references/smartcontract-methods.json';
import { bignumber } from 'balance-common';

// -- Constants --------------------------------------- //
const WALLETCONNECT_UPDATE_TRANSACTIONS_TO_APPROVE = 'wallet/WALLETCONNECT_UPDATE_TRANSACTIONS_TO_APPROVE';

const getAssetDetails = (contractAddress, assets) => {
  for (var item of assets)  {
    if (item.address === contractAddress) {
      return { symbol: item.symbol, decimals: item.decimals }
    }
  }
  return null;
};

const getTransactionDisplayDetails = (transaction, assets) => {
  const tokenTransferHash = smartContractMethods.token_transfer.hash;
  if (transaction.data == '0x') {
    return {
      from: transaction.from,
      to: transaction.to,
      symbol: 'ETH',
      value: bignumber.fromWei(bignumber.convertHexToString(transaction.value)),
    }
  } else if (transaction.data.startsWith(tokenTransferHash)) {
    const contractAddress = transaction.to;
    const { symbol, decimals } = getAssetDetails(contractAddress, assets);
    const dataPayload = transaction.data.replace(tokenTransferHash, '');
    const toAddress = '0x' + dataPayload.slice(0, 64).replace(/^0+/, '');
    const amount = '0x' + dataPayload.slice(64,128).replace(/^0+/, '');
    const transferValue = bignumber.fromWei(bignumber.convertHexToString(amount), decimals);
    return {
      from: transaction.from,
      to: toAddress,
      symbol: symbol,
      value: transferValue,
    }
  } else {
    console.log('This type of transaction is currently not supported.');
    return null;
  }
};

export const addTransactionToApprove = (transactionId, transactionPayload) => (dispatch, getState) => {
  const { transactionsToApprove } = getState().transactionsToApprove;
  const { accountInfo } = getState().account;
  const transactionDisplayDetails = getTransactionDisplayDetails(transactionPayload, accountInfo.assets);
  const transaction = { transactionId, transactionPayload, transactionDisplayDetails };
  const updatedTransactions = transactionsToApprove.concat(transaction);
  dispatch({ type: WALLETCONNECT_UPDATE_TRANSACTIONS_TO_APPROVE, payload: updatedTransactions });
};

export const getTransactionToApprove = () => (dispatch, getState) => {
  const { transactionsToApprove } = getState().transactionsToApprove;
  const transaction = transactionsToApprove[0] || null;
  const remainingTransactions = transactionsToApprove.slice(1,);
  dispatch({ type: WALLETCONNECT_UPDATE_TRANSACTIONS_TO_APPROVE, payload: remainingTransactions });
  return transaction;
};


// -- Reducer ----------------------------------------- //
const INITIAL_STATE = {
  fetching: false,
  transactionsToApprove: [],
};

export default (state = INITIAL_STATE, action) => {
  switch (action.type) {
    case WALLETCONNECT_UPDATE_TRANSACTIONS_TO_APPROVE:
      return {
        ...state,
        transactionsToApprove: action.payload,
      };
    default:
      return state;
  }
};
