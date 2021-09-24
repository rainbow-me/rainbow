import { Contract } from '@ethersproject/contracts';
import { Wallet } from '@ethersproject/wallet';
import { captureException } from '@sentry/react-native';
import { get } from 'lodash';
import { Rap, RapActionParameters, SwapActionParameters } from '../common';
import {
  ProtocolType,
  TransactionStatus,
  TransactionType,
} from '@rainbow-me/entities';
import { toHex } from '@rainbow-me/handlers/web3';
import { dataAddNewTransaction } from '@rainbow-me/redux/data';
import store from '@rainbow-me/redux/store';
import { TypeSpecificParameters } from '@rainbow-me/redux/swap';
import {
  compoundCERC20ABI,
  compoundCETHABI,
  ETH_ADDRESS,
  ethUnits,
  savingsAssetsListByUnderlying,
} from '@rainbow-me/references';
import { convertAmountToRawAmount, isEqual } from '@rainbow-me/utilities';
import { gasUtils } from '@rainbow-me/utils';
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
  const { gasPrices, selectedGasPrice } = store.getState().gas;

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

  let gasPrice = selectedGasPrice?.value.amount;
  if (!gasPrice) {
    gasPrice = get(gasPrices, `[${gasUtils.FAST}].value.amount`);
  }

  logger.log(`[${actionName}] gas price`, gasPrice);
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
    gasPrice: toHex(gasPrice) || undefined,
    nonce: baseNonce ? toHex(baseNonce + index) : undefined,
    value: toHex(0),
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
    from: accountAddress,
    gasLimit: transactionParams.gasLimit,
    gasPrice: transactionParams.gasPrice,
    hash: withdraw?.hash,
    nonce: withdraw?.nonce,
    protocol: ProtocolType.compound,
    status: TransactionStatus.withdrawing,
    to: withdraw?.to,
    type: TransactionType.withdraw,
  };

  logger.log(`[${actionName}] adding new txn`, newTransaction);
  // Disable the txn watcher because Compound can silently fail
  await dispatch(dataAddNewTransaction(newTransaction, accountAddress, true));
  return withdraw?.nonce;
};

export default withdrawCompound;
