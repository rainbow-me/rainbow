import { find, get, toLower } from 'lodash';
import {
  calculateTradeDetails,
  executeSwap,
  estimateSwapGasLimit,
} from '../../handlers/uniswap';
import transactionStatusTypes from '../../helpers/transactionStatusTypes';
import transactionTypes from '../../helpers/transactionTypes';
import {
  convertHexToString,
  convertRawAmountToDecimalFormat,
  isZero,
} from '../../helpers/utilities';
import store from '../../redux/store';
import { dataAddNewTransaction } from '../../redux/data';
import { rapsAddOrUpdate } from '../../redux/raps';
import {
  TRANSFER_EVENT_TOPIC_LENGTH,
  TRANSFER_EVENT_KECCAK,
} from '../../references';
import { gasUtils, ethereumUtils } from '../../utils';

const NOOP = () => undefined;

export const findSwapOutputAmount = (receipt, accountAddress) => {
  const { logs } = receipt;
  const transferLog = find(logs, log => {
    const { topics } = log;
    const isTransferEvent =
      topics.length === TRANSFER_EVENT_TOPIC_LENGTH &&
      toLower(topics[0]) === TRANSFER_EVENT_KECCAK;
    if (!isTransferEvent) return false;

    const transferDestination = topics[2];
    const cleanTransferDestination = toLower(
      ethereumUtils.removeHexPrefix(transferDestination)
    );
    const addressNoHex = toLower(ethereumUtils.removeHexPrefix(accountAddress));
    const cleanAccountAddress = ethereumUtils.padLeft(addressNoHex, 64);

    return cleanTransferDestination === cleanAccountAddress;
  });
  if (!transferLog) return null;
  const { data } = transferLog;
  return convertHexToString(data);
};

const swap = async (wallet, currentRap, index, parameters) => {
  console.log('[swap] swap on uniswap!');
  const {
    accountAddress,
    chainId,
    inputAmount,
    inputAsExactAmount,
    inputCurrency,
    inputReserve,
    outputAmount,
    outputCurrency,
    outputReserve,
    selectedGasPrice = null,
  } = parameters;
  const { dispatch } = store;
  const { gasPrices } = store.getState().gas;
  console.log('[swap] calculating trade details');

  // Get Trade Details
  const tradeDetails = calculateTradeDetails(
    chainId,
    inputAmount,
    inputCurrency,
    inputReserve,
    outputAmount,
    outputCurrency,
    outputReserve,
    inputAsExactAmount
  );

  // Execute Swap
  console.log('[swap] execute the swap');
  let gasPrice = get(selectedGasPrice, 'value.amount');

  // if swap is not the final action, use fast gas
  if (currentRap.actions.length - 1 > index || !gasPrice) {
    gasPrice = get(gasPrices, `[${gasUtils.FAST}].value.amount`);
  }

  const gasLimit = await estimateSwapGasLimit(accountAddress, tradeDetails);

  console.log('[swap] About to execute swap with', {
    gasLimit,
    gasPrice,
    tradeDetails,
    wallet,
  });

  const swap = await executeSwap(tradeDetails, gasLimit, gasPrice, wallet);
  console.log('[swap] response', swap);
  currentRap.actions[index].transaction.hash = swap.hash;
  dispatch(rapsAddOrUpdate(currentRap.id, currentRap));
  console.log('[swap] adding a new swap txn to pending', swap.hash);
  const newTransaction = {
    amount: inputAmount,
    asset: inputCurrency,
    from: accountAddress,
    hash: swap.hash,
    nonce: get(swap, 'nonce'),
    status: transactionStatusTypes.swapping,
    to: get(swap, 'to'),
    type: transactionTypes.swap,
  };
  console.log('[swap] adding new txn', newTransaction);
  dispatch(dataAddNewTransaction(newTransaction, true));
  console.log('[swap] calling the callback');
  currentRap.callback();
  currentRap.callback = NOOP;

  try {
    console.log('[swap] waiting for the swap to go thru');
    const receipt = await wallet.provider.waitForTransaction(swap.hash);
    console.log('[swap] receipt:', receipt);
    if (!isZero(receipt.status)) {
      currentRap.actions[index].transaction.confirmed = true;
      dispatch(rapsAddOrUpdate(currentRap.id, currentRap));
      const rawReceivedAmount = findSwapOutputAmount(receipt, accountAddress);
      console.log('[swap] raw received amount', rawReceivedAmount);
      console.log('[swap] updated raps');
      const convertedOutput = convertRawAmountToDecimalFormat(
        rawReceivedAmount
      );
      console.log('[swap] updated raps', convertedOutput);
      return convertedOutput;
    } else {
      console.log('[swap] status not success');
      currentRap.actions[index].transaction.confirmed = false;
      dispatch(rapsAddOrUpdate(currentRap.id, currentRap));
      return null;
    }
  } catch (error) {
    console.log('[swap] error waiting for swap', error);
    currentRap.actions[index].transaction.confirmed = false;
    dispatch(rapsAddOrUpdate(currentRap.id, currentRap));
    return null;
  }
};

export default swap;
