import { Wallet } from '@ethersproject/wallet';
import { captureException } from '@sentry/react-native';
import { get } from 'lodash';
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
import store from '@rainbow-me/redux/store';
import { greaterThan } from '@rainbow-me/utilities';
import { gasUtils } from '@rainbow-me/utils';
import logger from 'logger';

export const isValidSwapInput = ({
  inputCurrency,
  outputCurrency,
}: {
  inputCurrency: Asset | null;
  outputCurrency: Asset | null;
}) => !!inputCurrency && !!outputCurrency;

const swap = async (
  wallet: Wallet,
  currentRap: Rap,
  index: number,
  parameters: RapActionParameters
): Promise<null> => {
  logger.log('[swap] swap on uniswap!');
  const { inputAmount, tradeDetails } = parameters as SwapActionParameters;
  const { dispatch } = store;
  const { accountAddress, chainId } = store.getState().settings;
  const { inputCurrency, outputCurrency } = store.getState().swap;
  const { gasPrices, selectedGasPrice } = store.getState().gas;
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
  return null;
};

export default swap;
