import { TransactionReceipt } from '@ethersproject/abstract-provider';
import { Wallet } from '@ethersproject/wallet';
import { captureException } from '@sentry/react-native';
import { find, get, toLower } from 'lodash';
import { Rap, RapActionParameters, SwapActionParameters } from '../common';
import { Asset } from '@rainbow-me/entities';
import {
  estimateSwapGasLimit,
  executeSwap,
} from '@rainbow-me/handlers/uniswap';
import ProtocolTypes from '@rainbow-me/helpers/protocolTypes';
import TransactionStatusTypes from '@rainbow-me/helpers/transactionStatusTypes';
import TransactionTypes from '@rainbow-me/helpers/transactionTypes';
import { dataAddNewTransaction } from '@rainbow-me/redux/data';
import { rapsAddOrUpdate } from '@rainbow-me/redux/raps';
import store from '@rainbow-me/redux/store';
import {
  TRANSFER_EVENT_KECCAK,
  TRANSFER_EVENT_TOPIC_LENGTH,
} from '@rainbow-me/references';
import {
  convertHexToString,
  convertRawAmountToDecimalFormat,
  greaterThan,
  isZero,
} from '@rainbow-me/utilities';
import { ethereumUtils, gasUtils } from '@rainbow-me/utils';
import logger from 'logger';

const NOOP = () => undefined;

export const isValidSwapInput = ({
  inputCurrency,
  outputCurrency,
}: {
  inputCurrency: Asset | null;
  outputCurrency: Asset | null;
}) => !!inputCurrency && !!outputCurrency;

const findSwapOutputAmount = (
  receipt: TransactionReceipt,
  accountAddress: string
): string | null => {
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

export default async function swap(
  wallet: Wallet,
  currentRap: Rap,
  index: number,
  parameters: RapActionParameters
): Promise<string | null> {
  logger.log('[swap] swap on uniswap!');
  const {
    accountAddress,
    inputAmount,
    inputCurrency,
    outputCurrency,
    selectedGasPrice,
    tradeDetails,
  } = parameters as SwapActionParameters;
  const { dispatch } = store;
  const { chainId } = store.getState().settings;
  const { gasPrices } = store.getState().gas;
  logger.log('[swap] calculating trade details');

  // Execute Swap
  logger.log('[swap] execute the swap');
  let gasPrice = get(selectedGasPrice, 'value.amount');
  // if swap isn't the last action, use fast gas or custom (whatever is faster)
  if (currentRap.actions.length - 1 > index || !gasPrice) {
    const fastPrice = get(gasPrices, `[${gasUtils.FAST}].value.amount`);
    if (greaterThan(fastPrice, gasPrice)) {
      gasPrice = fastPrice;
    }
  }
  let gasLimit, methodName;
  try {
    const routeDetails = tradeDetails?.route?.path;
    logger.sentry('estimateSwapGasLimit', { accountAddress, routeDetails });
    const {
      gasLimit: newGasLimit,
      methodName: newMethodName,
    } = await estimateSwapGasLimit({
      accountAddress,
      chainId,
      inputCurrency,
      outputCurrency,
      tradeDetails,
    });
    gasLimit = newGasLimit;
    methodName = newMethodName;
  } catch (e) {
    logger.sentry('error executing estimateSwapGasLimit');
    captureException(e);
    throw e;
  }

  if (!methodName) {
    throw new Error('Error executing swap action - no method name found');
  }

  let swap;
  try {
    logger.sentry('executing swap', {
      gasLimit,
      gasPrice,
      methodName,
    });
    swap = await executeSwap({
      accountAddress,
      chainId,
      gasLimit,
      gasPrice,
      inputCurrency,
      methodName,
      outputCurrency,
      tradeDetails,
      wallet,
    });
  } catch (e) {
    logger.sentry('error executing swap');
    captureException(e);
    throw e;
  }

  logger.log('[swap] response', swap);
  currentRap.actions[index].transaction.hash = swap.hash;
  dispatch(rapsAddOrUpdate(currentRap.id, currentRap));
  logger.log('[swap] adding a new swap txn to pending', swap.hash);
  const newTransaction = {
    amount: inputAmount,
    asset: inputCurrency,
    from: accountAddress,
    gasLimit,
    gasPrice,
    hash: swap.hash,
    nonce: get(swap, 'nonce'),
    protocol: ProtocolTypes.uniswap.name,
    status: TransactionStatusTypes.swapping,
    to: get(swap, 'to'),
    type: TransactionTypes.trade,
  };
  logger.log('[swap] adding new txn', newTransaction);
  await dispatch(dataAddNewTransaction(newTransaction, accountAddress, true));
  logger.log('[swap] calling the callback');
  currentRap.callback();
  currentRap.callback = NOOP;

  try {
    logger.log('[swap] waiting for the swap to go thru');
    const receipt = await wallet.provider.waitForTransaction(swap.hash);
    logger.log('[swap] receipt:', receipt);
    if (receipt.status && !isZero(receipt.status)) {
      currentRap.actions[index].transaction.confirmed = true;
      dispatch(rapsAddOrUpdate(currentRap.id, currentRap));
      const rawReceivedAmount = findSwapOutputAmount(receipt, accountAddress);
      logger.log('[swap] raw received amount', rawReceivedAmount);
      logger.log('[swap] updated raps');
      if (!rawReceivedAmount) return null;
      const convertedOutput = convertRawAmountToDecimalFormat(
        rawReceivedAmount,
        outputCurrency.decimals
      );
      logger.log('[swap] updated raps', convertedOutput);
      return convertedOutput;
    } else {
      logger.log('[swap] status not success');
      currentRap.actions[index].transaction.confirmed = false;
      dispatch(rapsAddOrUpdate(currentRap.id, currentRap));
      return null;
    }
  } catch (error) {
    logger.log('[swap] error waiting for swap', error);
    currentRap.actions[index].transaction.confirmed = false;
    dispatch(rapsAddOrUpdate(currentRap.id, currentRap));
    return null;
  }
}
