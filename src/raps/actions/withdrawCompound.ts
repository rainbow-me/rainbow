import { Contract } from '@ethersproject/contracts';
import { Wallet } from '@ethersproject/wallet';
import { captureException } from '@sentry/react-native';
import { Rap, RapActionParameters, SwapActionParameters } from '../common';
import {
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
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/redux/swap' or its... Remove this comment to see the full error message
import { TypeSpecificParameters } from '@rainbow-me/redux/swap';
import {
  compoundCERC20ABI,
  compoundCETHABI,
  ETH_ADDRESS,
  ethUnits,
  savingsAssetsListByUnderlying,
  // @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/references' or its... Remove this comment to see the full error message
} from '@rainbow-me/references';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/utilities' or its ... Remove this comment to see the full error message
import { convertAmountToRawAmount, isEqual } from '@rainbow-me/utilities';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/utils' or its corr... Remove this comment to see the full error message
import { gasUtils } from '@rainbow-me/utils';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module 'logger' or its corresponding t... Remove this comment to see the full error message
import logger from 'logger';

const CTOKEN_DECIMALS = 8;

const actionName = 'withdrawCompound';

const withdrawCompound = async (
  wallet: Wallet,
  currentRap: Rap,
  index: number,
  parameters: RapActionParameters,
  baseNonce?: number
): Promise<number | undefined> => {
  logger.log(`[${actionName}] base nonce`, baseNonce, 'index:', index);
  const { inputAmount } = parameters as SwapActionParameters;
  const { dispatch } = store;
  const { accountAddress, network } = store.getState().settings;
  const { inputCurrency, typeSpecificParameters } = store.getState().swap;
  const { gasFeeParamsBySpeed, selectedGasFee } = store.getState().gas;

  const {
    cTokenBalance,
    supplyBalanceUnderlying,
  } = typeSpecificParameters as TypeSpecificParameters;

  const isMax = isEqual(inputAmount, supplyBalanceUnderlying);
  const rawInputAmount = convertAmountToRawAmount(
    isMax ? cTokenBalance : inputAmount,
    isMax ? CTOKEN_DECIMALS : inputCurrency.decimals
  );
  logger.log(`[${actionName}] is max`, isMax);
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
    savingsAssetsListByUnderlying[network as string][inputCurrency.address]
      .contractAddress;

  const compound = new Contract(
    cTokenContract,
    inputCurrency.address === ETH_ADDRESS ? compoundCETHABI : compoundCERC20ABI,
    wallet
  );

  const transactionParams = {
    gasLimit: ethUnits.basic_withdrawal,
    maxFeePerGas: toHex(maxFeePerGas) || undefined,
    maxPriorityFeePerGas: toHex(maxPriorityFeePerGas) || undefined,
    nonce: baseNonce ? toHex(baseNonce + index) : undefined,
  };

  let withdraw = null;
  try {
    logger.sentry(`[${actionName}] txn params`, transactionParams);
    withdraw = isMax
      ? await compound.redeem(rawInputAmount, transactionParams)
      : await compound.redeemUnderlying(rawInputAmount, transactionParams);
    logger.sentry(`[${actionName}] response`, withdraw);
  } catch (e) {
    logger.sentry(
      `[${actionName}] error executing ${
        isMax ? 'compound.redeem' : 'compound.redeemUnderlying'
      }`
    );
    captureException(e);
    throw e;
  }

  const newTransaction = {
    amount: inputAmount,
    asset: inputCurrency,
    data: withdraw.data,
    from: accountAddress,
    gasLimit: transactionParams.gasLimit,
    hash: withdraw?.hash,
    maxFeePerGas: transactionParams.maxFeePerGas,
    maxPriorityFeePerGas: transactionParams.maxPriorityFeePerGas,
    nonce: withdraw?.nonce,
    protocol: ProtocolType.compound,
    status: TransactionStatus.withdrawing,
    to: withdraw?.to,
    type: TransactionType.withdraw,
    value: toHex(withdraw.value),
  };

  logger.log(`[${actionName}] adding new txn`, newTransaction);
  // Disable the txn watcher because Compound can silently fail
  await dispatch(dataAddNewTransaction(newTransaction, accountAddress, true));
  return withdraw?.nonce;
};

export default withdrawCompound;
