import { Contract } from '@ethersproject/contracts';
import { Wallet } from '@ethersproject/wallet';
import { captureException } from '@sentry/react-native';
import { get } from 'lodash';
import { Rap, RapActionParameters, WithdrawActionParameters } from '../common';
import { toHex } from '@rainbow-me/handlers/web3';
import ProtocolTypes from '@rainbow-me/helpers/protocolTypes';
import TransactionStatusTypes from '@rainbow-me/helpers/transactionStatusTypes';
import TransactionTypes from '@rainbow-me/helpers/transactionTypes';
import { dataAddNewTransaction } from '@rainbow-me/redux/data';
import { rapsAddOrUpdate } from '@rainbow-me/redux/raps';
import store from '@rainbow-me/redux/store';
import {
  compoundCERC20ABI,
  compoundCETHABI,
  ethUnits,
  savingsAssetsListByUnderlying,
} from '@rainbow-me/references';
import { convertAmountToRawAmount, isZero } from '@rainbow-me/utilities';
import { gasUtils } from '@rainbow-me/utils';
import logger from 'logger';

const NOOP = () => undefined;

const CTOKEN_DECIMALS = 8;

const withdrawCompound = async (
  wallet: Wallet,
  currentRap: Rap,
  index: number,
  parameters: RapActionParameters
): Promise<null> => {
  logger.log('[withdraw]');
  const {
    accountAddress,
    inputAmount,
    inputCurrency,
    isMax,
    network,
    selectedGasPrice,
  } = parameters as WithdrawActionParameters;
  const { dispatch } = store;
  const { gasPrices } = store.getState().gas;
  const rawInputAmount = convertAmountToRawAmount(
    inputAmount as string,
    isMax ? CTOKEN_DECIMALS : inputCurrency.decimals
  );
  logger.log('[withdraw] is max', isMax);
  logger.log('[withdraw] raw input amount', rawInputAmount);

  logger.log('[withdraw] execute the withdraw');
  let gasPrice = get(selectedGasPrice, 'value.amount');
  if (!gasPrice) {
    gasPrice = get(gasPrices, `[${gasUtils.FAST}].value.amount`);
  }

  logger.log('[withdraw] gas price', gasPrice);
  const cTokenContract =
    savingsAssetsListByUnderlying[network as string][inputCurrency.address]
      .contractAddress;

  const compound = new Contract(
    cTokenContract,
    inputCurrency.address === 'eth' ? compoundCETHABI : compoundCERC20ABI,
    wallet
  );

  const transactionParams = {
    gasLimit: ethUnits.basic_withdrawal,
    gasPrice: toHex(gasPrice) || undefined,
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

  currentRap.actions[index].transaction.hash = withdraw.hash;

  const newTransaction = {
    amount: inputAmount,
    asset: inputCurrency,
    from: accountAddress,
    gasLimit: transactionParams.gasLimit,
    gasPrice: transactionParams.gasPrice,
    hash: withdraw.hash,
    nonce: get(withdraw, 'nonce'),
    protocol: ProtocolTypes.compound.name,
    status: TransactionStatusTypes.withdrawing,
    to: get(withdraw, 'to'),
    type: TransactionTypes.withdraw,
  };

  logger.log('[withdraw] adding new txn', newTransaction);
  // Disable the txn watcher because Compound can silently fail
  await dispatch(dataAddNewTransaction(newTransaction, accountAddress, true));

  logger.log('[withdraw] calling the callback');
  currentRap.callback();
  currentRap.callback = NOOP;

  // wait for it to complete
  currentRap.actions[index].transaction.hash = withdraw.hash;
  try {
    logger.log('[withdraw] waiting for the withdraw to go thru');
    const receipt = await wallet.provider.waitForTransaction(withdraw.hash);
    logger.log('[withdraw] withdrawal completed! Receipt:', receipt);
    if (receipt.status && !isZero(receipt.status)) {
      currentRap.actions[index].transaction.confirmed = true;
      logger.log('[withdraw] updated txn confirmed to true');
      dispatch(rapsAddOrUpdate(currentRap.id, currentRap));
      logger.log('[withdraw] updated raps');
    } else {
      logger.log('[withdraw] status not success');
      currentRap.actions[index].transaction.confirmed = false;
      dispatch(rapsAddOrUpdate(currentRap.id, currentRap));
    }
  } catch (error) {
    logger.log('[withdraw] error waiting for withdraw', error);
    currentRap.actions[index].transaction.confirmed = false;
    dispatch(rapsAddOrUpdate(currentRap.id, currentRap));
  }
  logger.log('[withdraw] complete!');
  return null;
};

export default withdrawCompound;
