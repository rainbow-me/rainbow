import { Wallet } from '@ethersproject/wallet';
import { captureException } from '@sentry/react-native';
import { Token } from '@uniswap/sdk';
import { get } from 'lodash';
import {
  DepositUniswapActionParameters,
  Rap,
  RapActionParameters,
} from '../common';
import { Asset } from '@rainbow-me/entities';
import { depositToPool } from '@rainbow-me/handlers/uniswapLiquidity';
import { toHex } from '@rainbow-me/handlers/web3';
import ProtocolTypes from '@rainbow-me/helpers/protocolTypes';
import TransactionStatusTypes from '@rainbow-me/helpers/transactionStatusTypes';
import TransactionTypes from '@rainbow-me/helpers/transactionTypes';
import { dataAddNewTransaction } from '@rainbow-me/redux/data';
import { rapsAddOrUpdate } from '@rainbow-me/redux/raps';
import store from '@rainbow-me/redux/store';
import { ethUnits } from '@rainbow-me/references';
import { convertAmountToRawAmount, isZero } from '@rainbow-me/utilities';
import { gasUtils } from '@rainbow-me/utils';
import logger from 'logger';

const NOOP = () => undefined;

const actionTag = '[deposit Uniswap LP]';

// TODO JIN - fix this
export const getDepositUniswapGasLimit = (inputCurrency: Asset) =>
  inputCurrency.address === 'eth'
    ? ethUnits.basic_deposit_eth
    : ethUnits.basic_deposit;

const depositUniswapLP = async (
  wallet: Wallet,
  currentRap: Rap,
  index: number,
  parameters: RapActionParameters
): Promise<null> => {
  logger.log(`${actionTag}`);
  const {
    accountAddress,
    chainId,
    depositToken,
    inputAmount,
    inputCurrency,
    outputCurrency,
    network,
    selectedGasPrice,
  } = parameters as DepositUniswapActionParameters;
  const { dispatch } = store;
  const { gasPrices } = store.getState().gas;

  logger.log(`${actionTag}`, inputAmount);
  const rawInputAmount = convertAmountToRawAmount(
    inputAmount,
    inputCurrency.decimals
  );
  logger.log(`${actionTag} raw input amount`, rawInputAmount);

  logger.log(`${actionTag} execute the deposit`);
  let gasPrice = get(selectedGasPrice, 'value.amount');
  if (!gasPrice) {
    gasPrice = get(gasPrices, `[${gasUtils.FAST}].value.amount`);
  }
  logger.log(`${actionTag} gas price`, gasPrice);

  const transactionParams = {
    gasLimit: getDepositGasLimit(inputCurrency),
    gasPrice: toHex(gasPrice),
  };

  let deposit = null;
  try {
    logger.sentry(`${actionTag} txn params`, transactionParams);
    deposit = await depositToPool(
      depositToken, // TODO JIN
      new Token(chainId, inputCurrency.address, inputCurrency.decimals),
      new Token(chainId, outputCurrency.address, outputCurrency.decimals),
      chainId,
      rawInputAmount,
      network,
      transactionParams
    );
    // TODO JIN - how to get the txn itself, not the result?
    logger.sentry(`${actionTag} minted - result`, deposit);
  } catch (e) {
    logger.sentry('error executing deposit to Uniswap LP');
    captureException(e);
    throw e;
  }
  currentRap.actions[index].transaction.hash = deposit.hash;

  const newTransaction = {
    amount: inputAmount,
    asset: inputCurrency,
    from: accountAddress,
    gasLimit: transactionParams.gasLimit,
    gasPrice: transactionParams.gasPrice,
    hash: deposit.hash,
    nonce: get(deposit, 'nonce'),
    protocol: ProtocolTypes.uniswap.name, // TODO JIN - should uniswap deposits be separate?
    status: TransactionStatusTypes.depositing, // TODO JIN - different deposit for Uniswap
    to: get(deposit, 'to'),
    type: TransactionTypes.deposit, // TODO JIN - different type
  };
  logger.log(`${actionTag} adding new txn`, newTransaction);
  // Disable the txn watcher because Compound can silently fail
  await dispatch(dataAddNewTransaction(newTransaction, accountAddress, true));
  logger.log(`${actionTag} calling the callback`);
  currentRap.callback();
  currentRap.callback = NOOP;

  // wait for it to complete
  currentRap.actions[index].transaction.hash = deposit.hash;
  try {
    logger.log(`${actionTag} waiting for the deposit to go thru`, deposit.hash);
    const receipt = await wallet.provider.waitForTransaction(deposit.hash);
    logger.log(`${actionTag} receipt:`, receipt);
    if (receipt.status && !isZero(receipt.status)) {
      currentRap.actions[index].transaction.confirmed = true;
      dispatch(rapsAddOrUpdate(currentRap.id, currentRap));
      logger.log(`${actionTag} updated raps`);
    } else {
      logger.log(`${actionTag} status not success`);
      currentRap.actions[index].transaction.confirmed = false;
      dispatch(rapsAddOrUpdate(currentRap.id, currentRap));
    }
  } catch (error) {
    logger.log(`${actionTag} error waiting for deposit`, error);
    currentRap.actions[index].transaction.confirmed = false;
    dispatch(rapsAddOrUpdate(currentRap.id, currentRap));
  }
  logger.log(`${actionTag} completed`);
  return null;
};

export default depositUniswapLP;
