import { Contract } from '@ethersproject/contracts';
import { captureException } from '@sentry/react-native';
import { get } from 'lodash';
import { toHex } from '../../handlers/web3';
import ProtocolTypes from '../../helpers/protocolTypes';
import TransactionStatusTypes from '../../helpers/transactionStatusTypes';
import TransactionTypes from '../../helpers/transactionTypes';
import { convertAmountToRawAmount, isZero } from '../../helpers/utilities';
import { dataAddNewTransaction } from '../../redux/data';
import { rapsAddOrUpdate } from '../../redux/raps';
import store from '../../redux/store';
import {
  compoundCERC20ABI,
  compoundCETHABI,
  ethUnits,
  savingsAssetsListByUnderlying,
} from '../../references';
import { gasUtils } from '../../utils';
import logger from 'logger';

const NOOP = () => undefined;

export const getDepositGasLimit = inputCurrency =>
  inputCurrency.address === 'eth'
    ? ethUnits.basic_deposit_eth
    : ethUnits.basic_deposit;

const depositCompound = async (wallet, currentRap, index, parameters) => {
  logger.log('[deposit]');
  const {
    accountAddress,
    inputAmount,
    inputCurrency,
    network,
    override,
    selectedGasPrice,
  } = parameters;
  const { dispatch } = store;
  const { gasPrices } = store.getState().gas;
  const _inputAmount = override || inputAmount;
  logger.log('[deposit]', inputAmount, override, _inputAmount);
  const rawInputAmount = convertAmountToRawAmount(
    _inputAmount,
    inputCurrency.decimals
  );
  logger.log('[deposit] raw input amount', rawInputAmount);

  logger.log('[deposit] execute the deposit');
  let gasPrice = get(selectedGasPrice, 'value.amount');
  if (!gasPrice) {
    gasPrice = get(gasPrices, `[${gasUtils.FAST}].value.amount`);
  }
  logger.log('[deposit] gas price', gasPrice);

  const cTokenContract =
    savingsAssetsListByUnderlying[network][inputCurrency.address]
      .contractAddress;
  logger.log('ctokencontract', cTokenContract);

  const compound = new Contract(
    cTokenContract,
    inputCurrency.address === 'eth' ? compoundCETHABI : compoundCERC20ABI,
    wallet
  );

  const transactionParams = {
    gasLimit: getDepositGasLimit(inputCurrency),
    gasPrice: toHex(gasPrice) || undefined,
    value: toHex(0),
  };

  let deposit = null;
  try {
    logger.sentry('[deposit] txn params', transactionParams);
    deposit = await compound.mint(rawInputAmount, transactionParams);
    logger.sentry('[deposit] minted - result', deposit);
  } catch (e) {
    logger.sentry('error executing compound.mint');
    captureException(e);
    throw e;
  }
  currentRap.actions[index].transaction.hash = deposit.hash;

  const newTransaction = {
    amount: _inputAmount,
    asset: inputCurrency,
    from: accountAddress,
    gasLimit: transactionParams.gasLimit,
    gasPrice: transactionParams.gasPrice,
    hash: deposit.hash,
    nonce: get(deposit, 'nonce'),
    protocol: ProtocolTypes.compound.name,
    status: TransactionStatusTypes.depositing,
    to: get(deposit, 'to'),
    type: TransactionTypes.deposit,
  };
  logger.log('[deposit] adding new txn', newTransaction);
  // Disable the txn watcher because Compound can silently fail
  await dispatch(dataAddNewTransaction(newTransaction, accountAddress, true));
  logger.log('[deposit] calling the callback');
  currentRap.callback();
  currentRap.callback = NOOP;

  // wait for it to complete
  currentRap.actions[index].transaction.hash = deposit.hash;
  try {
    logger.log('[deposit] waiting for the deposit to go thru', deposit.hash);
    const receipt = await wallet.provider.waitForTransaction(deposit.hash);
    logger.log('[deposit] receipt:', receipt);
    if (!isZero(receipt.status)) {
      currentRap.actions[index].transaction.confirmed = true;
      dispatch(rapsAddOrUpdate(currentRap.id, currentRap));
      logger.log('[deposit] updated raps');
    } else {
      logger.log('[deposit] status not success');
      currentRap.actions[index].transaction.confirmed = false;
      dispatch(rapsAddOrUpdate(currentRap.id, currentRap));
    }
  } catch (error) {
    logger.log('[deposit] error waiting for deposit', error);
    currentRap.actions[index].transaction.confirmed = false;
    dispatch(rapsAddOrUpdate(currentRap.id, currentRap));
  }
  logger.log('[deposit] completed');
  return null;
};

export default depositCompound;
