import { ethers } from 'ethers';
import { get } from 'lodash';
import { toHex } from '../../handlers/web3';
import TransactionStatusTypes from '../../helpers/transactionStatusTypes';
import TransactionTypes from '../../helpers/transactionTypes';
import { convertAmountToRawAmount, isZero } from '../../helpers/utilities';
import { dataAddNewTransaction } from '../../redux/data';
import { rapsAddOrUpdate } from '../../redux/raps';
import store from '../../redux/store';
import {
  compoundCETHABI,
  compoundCERC20ABI,
  savingsAssetsListByUnderlying,
} from '../../references';
import { logger, gasUtils } from '../../utils';

const NOOP = () => undefined;

const CTOKEN_DECIMALS = 8;
const SAVINGS_ERC20_WITHDRAW_GAS_LIMIT = 500000;

const withdrawCompound = async (wallet, currentRap, index, parameters) => {
  logger.log('[withdraw]');
  const {
    accountAddress,
    inputAmount,
    inputCurrency,
    isMax,
    network,
    selectedGasPrice,
  } = parameters;
  const { dispatch } = store;
  const { gasPrices } = store.getState().gas;
  const rawInputAmount = convertAmountToRawAmount(
    inputAmount,
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
    savingsAssetsListByUnderlying[network][inputCurrency.address]
      .contractAddress;

  const compound = new ethers.Contract(
    cTokenContract,
    inputCurrency.address === 'eth' ? compoundCETHABI : compoundCERC20ABI,
    wallet
  );

  const transactionParams = {
    gasLimit: SAVINGS_ERC20_WITHDRAW_GAS_LIMIT,
    gasPrice: gasPrice ? toHex(gasPrice) : undefined,
    value: toHex(0),
  };
  logger.log('[withdraw] txn params', transactionParams);
  const withdraw = isMax
    ? await compound.redeem(rawInputAmount, transactionParams)
    : await compound.redeemUnderlying(rawInputAmount, transactionParams);
  logger.log('[withdraw] redeemed - result', withdraw);

  currentRap.actions[index].transaction.hash = withdraw.hash;

  const newTransaction = {
    amount: inputAmount,
    asset: inputCurrency,
    from: accountAddress,
    hash: withdraw.hash,
    nonce: get(withdraw, 'nonce'),
    status: TransactionStatusTypes.withdrawing,
    to: get(withdraw, 'to'),
    type: TransactionTypes.withdraw,
  };

  logger.log('[withdraw] adding new txn', newTransaction);
  // Disable the txn watcher because Compound can silently fail
  dispatch(dataAddNewTransaction(newTransaction, true));

  logger.log('[withdraw] calling the callback');
  currentRap.callback();
  currentRap.callback = NOOP;

  // wait for it to complete
  currentRap.actions[index].transaction.hash = withdraw.hash;
  try {
    logger.log('[withdraw] waiting for the withdraw to go thru');
    const receipt = await wallet.provider.waitForTransaction(withdraw.hash);
    logger.log('[withdraw] withdrawal completed! Receipt:', receipt);
    if (!isZero(receipt.status)) {
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
