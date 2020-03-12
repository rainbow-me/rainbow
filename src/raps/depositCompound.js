import { ethers } from 'ethers';
import { get } from 'lodash';
import { toHex } from '../handlers/web3';
import { convertAmountToRawAmount } from '../helpers/utilities';
import { dataAddNewTransaction } from '../redux/data';
import { rapsAddOrUpdate } from '../redux/raps';
import store from '../redux/store';
import { gasUtils } from '../utils';
import { CDAI_CONTRACT } from '../references';
import compoundCDAIABI from '../references/compound/compound-cdai-abi.json';

const NOOP = () => undefined;

const estimateDepositGasLimit = async (
  compound,
  accountAddress,
  rawMintAmount
) => {
  try {
    console.log('[deposit] estimating gas');
    const params = { from: accountAddress, value: toHex(0) };
    const gasLimit = await compound.estimate.mint(rawMintAmount, params);
    console.log('[deposit] estimated gas limit for deposit', gasLimit);
    console.log(
      '[deposit] TO STRING estimated gas limit for deposit',
      gasLimit.toString()
    );
    return gasLimit ? gasLimit.toString() : null;
  } catch (error) {
    console.log('[deposit] ERROR estimating gas', error);
    return null;
  }
};

const depositCompound = async (wallet, currentRap, index, parameters) => {
  console.log('[deposit]');
  const { inputAmount, inputCurrency, selectedGasPrice } = parameters;
  const { dispatch } = store;
  const { gasPrices } = store.getState().gas;
  const { accountAddress } = store.getState().settings;
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

  const compound = new ethers.Contract(CDAI_CONTRACT, compoundCDAIABI, wallet);

  const gasLimit = await estimateDepositGasLimit(
    compound,
    accountAddress,
    rawInputAmount
  );

  const transactionParams = {
    gasLimit: gasLimit ? toHex(gasLimit) : undefined,
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
