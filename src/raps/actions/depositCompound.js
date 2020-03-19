import { ethers } from 'ethers';
import { get } from 'lodash';
import { toHex } from '../../handlers/web3';
import { convertAmountToRawAmount } from '../../helpers/utilities';
import { dataAddNewTransaction } from '../../redux/data';
import { rapsAddOrUpdate } from '../../redux/raps';
import store from '../../redux/store';
import {
  compoundCETHABI,
  compoundCERC20ABI,
  savingsAssetsListByUnderlying,
} from '../../references';
import { gasUtils } from '../../utils';
import transactionTypes from '../../helpers/transactionTypes';

const NOOP = () => undefined;
const SAVINGS_ERC20_DEPOSIT_GAS_LIMIT = 350000;
const SAVINGS_ETH_DEPOSIT_GAS_LIMIT = 200000;

const depositCompound = async (wallet, currentRap, index, parameters) => {
  console.log('[deposit]');
  const { inputAmount, inputCurrency, selectedGasPrice } = parameters;
  const { dispatch } = store;
  const { gasPrices } = store.getState().gas;
  const { accountAddress, network } = store.getState().settings;
  const rawInputAmount = convertAmountToRawAmount(
    inputAmount,
    inputCurrency.decimals
  );
  console.log('[deposit] raw input amount', rawInputAmount);

  console.log('[deposit] execute the deposit');
  let gasPrice = get(selectedGasPrice, 'value.amount');
  if (!gasPrice) {
    gasPrice = get(gasPrices, `[${gasUtils.FAST}].value.amount`);
  }
  console.log('[deposit] gas price', gasPrice);

  const cTokenContract =
    savingsAssetsListByUnderlying[network][inputCurrency.address]
      .contractAddress;
  console.log('ctokencontract', cTokenContract);

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
  console.log('[deposit] txn params', transactionParams);
  const deposit = await compound.mint(rawInputAmount, transactionParams);
  console.log('[deposit] minted - result', deposit);

  currentRap.actions[index].transaction.hash = deposit.hash;

  const newTransaction = {
    amount: inputAmount,
    asset: inputCurrency,
    from: accountAddress,
    hash: deposit.hash,
    nonce: get(deposit, 'nonce'),
    to: get(deposit, 'to'),
    type: transactionTypes.deposit,
  };
  console.log('[deposit] adding new txn', newTransaction);
  dispatch(dataAddNewTransaction(newTransaction, true));
  console.log('[deposit] calling the callback');
  currentRap.callback();
  currentRap.callback = NOOP;

  // wait for it to complete
  currentRap.actions[index].transaction.hash = deposit.hash;
  try {
    console.log('[deposit] waiting for the deposit to go thru');
    await deposit.wait();
    console.log('[deposit] deposit completed!');
    // update rap for confirmed status
    currentRap.actions[index].transaction.confirmed = true;
    dispatch(rapsAddOrUpdate(currentRap.id, currentRap));
  } catch (error) {
    console.log('[deposit] error waiting for deposit', error);
    currentRap.actions[index].transaction.confirmed = false;
    dispatch(rapsAddOrUpdate(currentRap.id, currentRap));
  }
};

export default depositCompound;
