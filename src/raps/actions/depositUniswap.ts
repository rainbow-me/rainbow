import { Wallet } from '@ethersproject/wallet';
import { captureException } from '@sentry/react-native';
import { get } from 'lodash';
import { Rap, RapActionParameters, SwapActionParameters } from '../common';
import {
  ExchangeModalType,
  ProtocolType,
  TransactionParams,
  TransactionStatus,
  TransactionType,
} from '@rainbow-me/entities';
import { depositToPool } from '@rainbow-me/handlers/uniswapLiquidity';
import { toHex } from '@rainbow-me/handlers/web3';
import { dataAddNewTransaction } from '@rainbow-me/redux/data';
import store from '@rainbow-me/redux/store';
import {
  DepositUniswapParameters,
  TypeSpecificParameters,
} from '@rainbow-me/redux/swap';
import { ethUnits } from '@rainbow-me/references';
import { convertAmountToRawAmount } from '@rainbow-me/utilities';
import { gasUtils } from '@rainbow-me/utils';
import logger from 'logger';

const actionName = '[deposit uniswap]';

const getDepositUniswap = (
  inputAmount: string,
  transactionParams: TransactionParams,
  estimateGas = false,
  wallet: Wallet | null = null
) => {
  const { inputCurrency, typeSpecificParameters } = store.getState().swap;
  const {
    [ExchangeModalType.depositUniswap]: depositParams,
  } = typeSpecificParameters as TypeSpecificParameters;
  const { uniswapPair } = depositParams as DepositUniswapParameters;
  const { network } = store.getState().settings;

  const rawInputAmount = convertAmountToRawAmount(
    inputAmount,
    inputCurrency.decimals
  );
  return depositToPool(
    inputCurrency.address,
    uniswapPair,
    rawInputAmount,
    network,
    transactionParams,
    estimateGas,
    wallet
  );
};

export const estimateDepositUniswap = async (inputAmount: string) => {
  try {
    const transactionParams = {
      gasLimit: undefined,
      gasPrice: undefined,
      nonce: undefined,
    };
    const gasLimit = await getDepositUniswap(
      inputAmount,
      transactionParams,
      true
    );
    return gasLimit ?? ethUnits.basic_deposit_uniswap;
  } catch (error) {
    return ethUnits.basic_deposit_uniswap;
  }
};

const depositUniswap = async (
  wallet: Wallet,
  currentRap: Rap,
  index: number,
  parameters: RapActionParameters,
  baseNonce?: number
): Promise<number | undefined> => {
  logger.log(`${actionName} base nonce`, baseNonce, 'index:', index);
  const { inputAmount } = parameters as SwapActionParameters;
  const { dispatch } = store;
  const { inputCurrency } = store.getState().swap;
  const { accountAddress } = store.getState().settings;
  const { gasPrices, selectedGasPrice } = store.getState().gas;

  logger.log(`${actionName}`, inputAmount);

  let gasPrice = get(selectedGasPrice, 'value.amount');
  if (!gasPrice) {
    gasPrice = get(gasPrices, `[${gasUtils.FAST}].value.amount`);
  }
  logger.log(`${actionName} gas price`, gasPrice);

  const gasLimit = await estimateDepositUniswap(inputAmount);

  const transactionParams = {
    gasLimit,
    gasPrice: toHex(gasPrice),
    nonce: baseNonce ? toHex(baseNonce + index) : undefined,
  };

  let deposit = null;
  try {
    logger.sentry(`${actionName} txn params`, transactionParams);
    deposit = await getDepositUniswap(
      inputAmount,
      transactionParams,
      false,
      wallet
    );
    logger.sentry(`${actionName} response`, deposit);
  } catch (e) {
    logger.sentry(`${actionName} error executing deposit to Uniswap LP`);
    captureException(e);
    throw e;
  }

  const newTransaction = {
    amount: inputAmount,
    asset: inputCurrency,
    from: accountAddress,
    gasLimit: transactionParams.gasLimit,
    gasPrice: transactionParams.gasPrice,
    hash: deposit?.hash,
    nonce: deposit?.nonce,
    protocol: ProtocolType.uniswap,
    status: TransactionStatus.depositing,
    to: deposit?.to,
    type: TransactionType.deposit,
  };
  logger.log(`${actionName} adding new txn`, newTransaction);
  await dispatch(dataAddNewTransaction(newTransaction, accountAddress));

  return deposit?.nonce;
};

export default depositUniswap;
