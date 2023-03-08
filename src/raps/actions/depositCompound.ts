import { Contract } from '@ethersproject/contracts';
import { Signer } from '@ethersproject/abstract-signer';
import { captureException } from '@sentry/react-native';
import {
  Rap,
  RapExchangeActionParameters,
  SwapActionParameters,
} from '../common';
import {
  Asset,
  ProtocolType,
  TransactionStatus,
  TransactionType,
} from '@/entities';
import { toHex } from '@/handlers/web3';
import { dataAddNewTransaction } from '@/redux/data';
import store from '@/redux/store';
import {
  compoundCERC20ABI,
  compoundCETHABI,
  ETH_ADDRESS,
  ethUnits,
  savingsAssetsListByUnderlying,
} from '@/references';
import { convertAmountToRawAmount } from '@/helpers/utilities';
import { gasUtils } from '@/utils';
import logger from '@/utils/logger';
import { parseGasParamsForTransaction } from '@/parsers';

export const getDepositGasLimit = (tokenToDeposit: Asset) =>
  tokenToDeposit.address === ETH_ADDRESS
    ? ethUnits.basic_deposit_eth
    : ethUnits.basic_deposit;

const actionName = 'depositCompound';

const depositCompound = async (
  wallet: Signer,
  currentRap: Rap,
  index: number,
  parameters: RapExchangeActionParameters,
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
  const { gasFeeParamsBySpeed, selectedGasFee } = store.getState().gas;
  logger.log(`[${actionName}] amount`, amountToDeposit);
  const rawInputAmount = convertAmountToRawAmount(
    amountToDeposit,
    tokenToDeposit.decimals
  );
  logger.log(`[${actionName}] raw input amount`, rawInputAmount);
  const gasParams = parseGasParamsForTransaction(selectedGasFee);

  let maxFeePerGas = gasParams.maxFeePerGas;
  let maxPriorityFeePerGas = gasParams.maxPriorityFeePerGas;

  if (!maxFeePerGas) {
    maxFeePerGas = gasFeeParamsBySpeed?.[gasUtils.FAST]?.maxFeePerGas?.amount;
  }
  if (!maxPriorityFeePerGas) {
    maxPriorityFeePerGas =
      gasFeeParamsBySpeed?.[gasUtils.FAST]?.maxPriorityFeePerGas?.amount;
  }

  logger.log(`[${actionName}] max fee per gas`, maxFeePerGas);
  logger.log(`[${actionName}] max priority fee per gas`, maxPriorityFeePerGas);

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
    maxFeePerGas,
    maxPriorityFeePerGas,
    nonce: baseNonce ? toHex(baseNonce + index) : undefined,
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
    data: deposit.data,
    from: accountAddress,
    gasLimit: transactionParams.gasLimit,
    hash: deposit?.hash,
    maxFeePerGas: transactionParams.maxFeePerGas,
    maxPriorityFeePerGas: transactionParams.maxPriorityFeePerGas,
    nonce: deposit?.nonce,
    protocol: ProtocolType.compound,
    status: TransactionStatus.depositing,
    to: deposit?.to,
    type: TransactionType.deposit,
    value: toHex(deposit.value),
  };
  logger.log(`[${actionName}] adding new txn`, newTransaction);
  // Disable the txn watcher because Compound can silently fail
  await dispatch(dataAddNewTransaction(newTransaction, accountAddress, true));
  return deposit?.nonce;
};

export default depositCompound;
