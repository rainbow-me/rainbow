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
import { gasUtils, logger } from '../../utils';

const NOOP = () => undefined;
const SAVINGS_ERC20_DEPOSIT_GAS_LIMIT = 350000;
const SAVINGS_ETH_DEPOSIT_GAS_LIMIT = 200000;

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

  const compound = new ethers.Contract(
    cTokenContract,
    inputCurrency.address === 'eth' ? compoundCETHABI : compoundCERC20ABI,
    wallet
  );

  const transactionParams = {
    gasLimit:
      inputCurrency.address === 'eth'
        ? SAVINGS_ETH_DEPOSIT_GAS_LIMIT
        : SAVINGS_ERC20_DEPOSIT_GAS_LIMIT,
    gasPrice: gasPrice ? toHex(gasPrice) : undefined,
    value: toHex(0),
  };
  logger.log('[deposit] txn params', transactionParams);
  const deposit = await compound.mint(rawInputAmount, transactionParams);
  logger.log('[deposit] minted - result', deposit);

  currentRap.actions[index].transaction.hash = deposit.hash;

  const newTransaction = {
    amount: _inputAmount,
    asset: inputCurrency,
    from: accountAddress,
    hash: deposit.hash,
    nonce: get(deposit, 'nonce'),
    status: TransactionStatusTypes.depositing,
    to: get(deposit, 'to'),
    type: TransactionTypes.deposit,
  };
  logger.log('[deposit] adding new txn', newTransaction);
  // Disable the txn watcher because Compound can silently fail
  dispatch(dataAddNewTransaction(newTransaction, true));
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
