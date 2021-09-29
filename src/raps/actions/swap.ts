import { Wallet } from '@ethersproject/wallet';
import { captureException } from '@sentry/react-native';
import { get } from 'lodash';
import { Rap, RapActionParameters, SwapActionParameters } from '../common';
import {
  ProtocolType,
  TransactionStatus,
  TransactionType,
} from '@rainbow-me/entities';
import {
  estimateSwapGasLimit,
  executeSwap,
} from '@rainbow-me/handlers/uniswap';
import { dataAddNewTransaction } from '@rainbow-me/redux/data';
import store from '@rainbow-me/redux/store';
import { ethUnits } from '@rainbow-me/references';
import { greaterThan } from '@rainbow-me/utilities';
import { gasUtils } from '@rainbow-me/utils';
import logger from 'logger';

const actionName = 'swap';

const swap = async (
  wallet: Wallet,
  currentRap: Rap,
  index: number,
  parameters: RapActionParameters,
  baseNonce?: number
): Promise<number | undefined> => {
  logger.log(`[${actionName}] base nonce`, baseNonce, 'index:', index);
  const requiresApprove = index > 0;
  const { inputAmount, tradeDetails } = parameters as SwapActionParameters;
  const { dispatch } = store;
  const { accountAddress, chainId } = store.getState().settings;
  const { inputCurrency } = store.getState().swap;
  const { gasPrices, selectedGasPrice } = store.getState().gas;

  let gasPrice = selectedGasPrice?.value?.amount;
  // if swap isn't the last action, use fast gas or custom (whatever is faster)
  if (currentRap.actions.length - 1 > index || !gasPrice) {
    const fastPrice = get(gasPrices, `[${gasUtils.FAST}].value.amount`);
    if (greaterThan(fastPrice, gasPrice)) {
      gasPrice = fastPrice;
    }
  }
  let gasLimit, methodName;
  try {
    logger.debug('ESTIMATING GAS LIMIT ON SWAP.TS')
    const newGasLimit = await estimateSwapGasLimit({
      chainId,
      requiresApprove: false,
      tradeDetails
    });
    gasLimit = newGasLimit;
  } catch (e) {
    logger.sentry(`[${actionName}] error estimateSwapGasLimit`);
    captureException(e);
    throw e;
  }

  let swap;
  try {
    logger.sentry(`[${actionName}] executing rap`, {
      gasLimit,
      gasPrice,
      methodName,
    });
    const nonce = baseNonce ? baseNonce + index : undefined;
    swap = await executeSwap({
      chainId,
      gasLimit,
      gasPrice,
      nonce,
      tradeDetails,
      wallet,
    });
  } catch (e) {
    logger.sentry('Error', e);
    const fakeError = new Error('Failed to execute swap');
    captureException(fakeError);
    throw e;
  }

  logger.log(`[${actionName}] response`, swap);

  const newTransaction = {
    amount: inputAmount,
    asset: inputCurrency,
    from: accountAddress,
    gasLimit,
    gasPrice,
    hash: swap?.hash,
    nonce: swap?.nonce,
    protocol: ProtocolType.uniswap,
    status: TransactionStatus.swapping,
    to: swap?.to,
    type: TransactionType.trade,
  };
  logger.log(`[${actionName}] adding new txn`, newTransaction);
  await dispatch(dataAddNewTransaction(newTransaction, accountAddress, false, wallet.provider));
  return swap?.nonce;
};

export default swap;
