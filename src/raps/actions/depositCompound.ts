import { Contract } from '@ethersproject/contracts';
import { Wallet } from '@ethersproject/wallet';
import { captureException } from '@sentry/react-native';
import { Rap, RapActionParameters, SwapActionParameters } from '../common';
import {
  Asset,
  ProtocolType,
  TransactionStatus,
  TransactionType,
  // @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/entities' or its c... Remove this comment to see the full error message
} from '@rainbow-me/entities';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/handlers/web3' or ... Remove this comment to see the full error message
import { toHex } from '@rainbow-me/handlers/web3';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/redux/data' or its... Remove this comment to see the full error message
import { dataAddNewTransaction } from '@rainbow-me/redux/data';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/redux/store' or it... Remove this comment to see the full error message
import store from '@rainbow-me/redux/store';
import {
  compoundCERC20ABI,
  compoundCETHABI,
  ETH_ADDRESS,
  ethUnits,
  savingsAssetsListByUnderlying,
  // @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/references' or its... Remove this comment to see the full error message
} from '@rainbow-me/references';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/utilities' or its ... Remove this comment to see the full error message
import { convertAmountToRawAmount } from '@rainbow-me/utilities';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/utils' or its corr... Remove this comment to see the full error message
import { gasUtils } from '@rainbow-me/utils';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module 'logger' or its corresponding t... Remove this comment to see the full error message
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
  const { gasFeeParamsBySpeed, selectedGasFee } = store.getState().gas;
  logger.log(`[${actionName}] amount`, amountToDeposit);
  const rawInputAmount = convertAmountToRawAmount(
    amountToDeposit,
    tokenToDeposit.decimals
  );
  logger.log(`[${actionName}] raw input amount`, rawInputAmount);

  let maxFeePerGas = selectedGasFee?.gasFeeParams?.maxFeePerGas?.amount;
  let maxPriorityFeePerGas =
    selectedGasFee?.gasFeeParams?.maxPriorityFeePerGas?.amount;

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
    maxFeePerGas: toHex(maxFeePerGas) || undefined,
    maxPriorityFeePerGas: toHex(maxPriorityFeePerGas) || undefined,
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
