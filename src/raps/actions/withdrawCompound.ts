import { Contract } from '@ethersproject/contracts';
import { Wallet } from '@ethersproject/wallet';
import { captureException } from '@sentry/react-native';
import { get } from 'lodash';
import { Rap, RapActionParameters, SwapActionParameters } from '../common';
import { toHex } from '@rainbow-me/handlers/web3';
import ProtocolTypes from '@rainbow-me/helpers/protocolTypes';
import TransactionStatusTypes from '@rainbow-me/helpers/transactionStatusTypes';
import TransactionTypes from '@rainbow-me/helpers/transactionTypes';
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

const withdrawCompound = async (
  wallet: Wallet,
  currentRap: Rap,
  index: number,
  parameters: RapActionParameters,
  baseNonce?: number
): Promise<number | undefined> => {
  logger.log('[withdraw]');
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
  logger.log('[withdraw] is max', isMax);
  logger.log('[withdraw] raw input amount', rawInputAmount);

  logger.log('[withdraw] execute the withdraw');
  let gasPrice = selectedGasPrice?.value.amount;
  if (!gasPrice) {
    gasPrice = get(gasPrices, `[${gasUtils.FAST}].value.amount`);
  }

  logger.log('[withdraw] gas price', gasPrice);
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
    logger.sentry('[withdraw] txn params', transactionParams);
    withdraw = isMax
      ? await compound.redeem(rawInputAmount, transactionParams)
      : await compound.redeemUnderlying(rawInputAmount, transactionParams);
    logger.sentry('[withdraw] redeemed - result', withdraw);
  } catch (e) {
    logger.sentry(
      `error executing ${
        isMax ? 'compound.redeem' : 'compound.redeemUnderlying'
      }`
    );
    captureException(e);
    throw e;
  }

  currentRap.actions[index].transaction.hash = withdraw?.hash;

  const newTransaction = {
    amount: inputAmount,
    asset: inputCurrency,
    from: accountAddress,
    gasLimit: transactionParams.gasLimit,
    gasPrice: transactionParams.gasPrice,
    hash: withdraw?.hash,
    nonce: withdraw?.nonce,
    protocol: ProtocolTypes.compound.name,
    status: TransactionStatusTypes.withdrawing,
    to: withdraw?.to,
    type: TransactionTypes.withdraw,
  };

  logger.log('[withdraw] adding new txn', newTransaction);
  // Disable the txn watcher because Compound can silently fail
  await dispatch(dataAddNewTransaction(newTransaction, accountAddress, true));
  logger.log('[withdraw] complete!');
  return withdraw?.nonce;
};

export default withdrawCompound;
