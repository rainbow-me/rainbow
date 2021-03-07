import { Wallet } from '@ethersproject/wallet';
import { captureException } from '@sentry/react-native';
import { get } from 'lodash';
import { Rap, RapActionParameters, SwapActionParameters } from '../common';
import { ExchangeModalType } from '@rainbow-me/entities';
import { depositToPool } from '@rainbow-me/handlers/uniswapLiquidity';
import { toHex } from '@rainbow-me/handlers/web3';
import ProtocolTypes from '@rainbow-me/helpers/protocolTypes';
import TransactionStatusTypes from '@rainbow-me/helpers/transactionStatusTypes';
import TransactionTypes from '@rainbow-me/helpers/transactionTypes';
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

// TODO JIN - fix this
export const estimateDepositUniswap = (inputAmount: string | null) => {
  return ethUnits.basic_deposit_uniswap;
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
  const { inputCurrency, typeSpecificParameters } = store.getState().swap;
  const { accountAddress, chainId, network } = store.getState().settings;
  const { gasPrices, selectedGasPrice } = store.getState().gas;

  const {
    [ExchangeModalType.depositUniswap]: depositParams,
  } = typeSpecificParameters as TypeSpecificParameters;
  const { uniswapPair } = depositParams as DepositUniswapParameters;

  logger.log(`${actionName}`, inputAmount);
  const rawInputAmount = convertAmountToRawAmount(
    inputAmount,
    inputCurrency.decimals
  );
  logger.log(`${actionName} raw input amount`, rawInputAmount);

  let gasPrice = get(selectedGasPrice, 'value.amount');
  if (!gasPrice) {
    gasPrice = get(gasPrices, `[${gasUtils.FAST}].value.amount`);
  }
  logger.log(`${actionName} gas price`, gasPrice);

  const transactionParams = {
    gasLimit: estimateDepositUniswap(),
    gasPrice: toHex(gasPrice),
    nonce: baseNonce ? toHex(baseNonce + index) : undefined,
  };

  let deposit = null;
  try {
    logger.sentry(`${actionName} txn params`, transactionParams);
    deposit = await depositToPool(
      inputCurrency,
      uniswapPair,
      chainId,
      rawInputAmount,
      network,
      transactionParams
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
    protocol: ProtocolTypes.uniswap.name, // TODO JIN - should uniswap deposits be separate?
    status: TransactionStatusTypes.depositing, // TODO JIN - different deposit for Uniswap
    to: deposit?.to,
    type: TransactionTypes.deposit, // TODO JIN - different type
  };
  logger.log(`${actionName} adding new txn`, newTransaction);
  await dispatch(dataAddNewTransaction(newTransaction, accountAddress));

  return deposit?.nonce;
};

export default depositUniswap;
