import { Contract } from '@ethersproject/contracts';
import { Wallet } from '@ethersproject/wallet';
import { captureException } from '@sentry/react-native';
import { get } from 'lodash';
import { Rap, RapActionParameters, SwapActionParameters } from '../common';
import {
  Asset,
  ProtocolType,
  TransactionStatus,
  TransactionType,
} from '@rainbow-me/entities';
import { toHex } from '@rainbow-me/handlers/web3';
import { dataAddNewTransaction } from '@rainbow-me/redux/data';
import store from '@rainbow-me/redux/store';
import {
  compoundCERC20ABI,
  compoundCETHABI,
  ETH_ADDRESS,
  ethUnits,
  savingsAssetsListByUnderlying,
} from '@rainbow-me/references';
import { convertAmountToRawAmount } from '@rainbow-me/utilities';
import { gasUtils } from '@rainbow-me/utils';
import logger from 'logger';

export const getDepositGasLimit = (tokenToDeposit: Asset) =>
  tokenToDeposit.address === ETH_ADDRESS
    ? ethUnits.basic_deposit_eth
    : ethUnits.basic_deposit;

const actionName = 'depositCompound';

const depositCompound = async (
  wallet: Wallet,
  currentRap: Rap,
  index: number,
  parameters: RapActionParameters,
  baseNonce?: number
): Promise<number | undefined> => {
  logger.log(`[${actionName}] base nonce`, baseNonce, 'index:', index);
  const { dispatch } = store;
  const { inputAmount, outputAmount } = parameters as SwapActionParameters;
  const { inputCurrency, outputCurrency } = store.getState().swap;
  const requiresSwap = !!outputCurrency;

  const amountToDeposit = requiresSwap ? outputAmount : inputAmount;
  const tokenToDeposit = requiresSwap ? outputCurrency : inputCurrency;

  const { accountAddress, network } = store.getState().settings;
  const { gasPrices, selectedGasPrice } = store.getState().gas;
  logger.log(`[${actionName}] amount`, amountToDeposit);
  const rawInputAmount = convertAmountToRawAmount(
    amountToDeposit,
    tokenToDeposit.decimals
  );
  logger.log(`[${actionName}] raw input amount`, rawInputAmount);

  let gasPrice = selectedGasPrice?.value?.amount;
  if (!gasPrice) {
    gasPrice = get(gasPrices, `[${gasUtils.FAST}].value.amount`);
  }
  logger.log(`[${actionName}] gas price`, gasPrice);

  const cTokenContract =
    savingsAssetsListByUnderlying[network][tokenToDeposit.address]
      .contractAddress;
  logger.log(`[${actionName}] ctokencontract`, cTokenContract);

  const compound = new Contract(
    cTokenContract,
    tokenToDeposit.address === ETH_ADDRESS
      ? compoundCETHABI
      : compoundCERC20ABI,
    wallet
  );

  const transactionParams = {
    gasLimit: getDepositGasLimit(tokenToDeposit),
    gasPrice: toHex(gasPrice) || undefined,
    nonce: baseNonce ? toHex(baseNonce + index) : undefined,
    value: toHex(0),
  };

  let deposit = null;
  try {
    logger.sentry(`[${actionName}] txn params`, transactionParams);
    deposit = await compound.mint(rawInputAmount, transactionParams);
    logger.sentry(`[${actionName}] response`, deposit);
  } catch (e) {
    logger.sentry(`[${actionName}] error executing compound.mint`);
    captureException(e);
    throw e;
  }

  const newTransaction = {
    amount: amountToDeposit,
    asset: tokenToDeposit,
    from: accountAddress,
    gasLimit: transactionParams.gasLimit,
    gasPrice: transactionParams.gasPrice,
    hash: deposit?.hash,
    nonce: deposit?.nonce,
    protocol: ProtocolType.compound,
    status: TransactionStatus.depositing,
    to: deposit?.to,
    type: TransactionType.deposit,
  };
  logger.log(`[${actionName}] adding new txn`, newTransaction);
  // Disable the txn watcher because Compound can silently fail
  await dispatch(dataAddNewTransaction(newTransaction, accountAddress, true));
  return deposit?.nonce;
};

export default depositCompound;
