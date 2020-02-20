import { get, toLower } from 'lodash';
import {
  calculateTradeDetails,
  executeSwap,
  estimateSwapGasLimit,
} from '../handlers/uniswap';
import { greaterThan } from '../helpers/utilities';
import store from '../redux/store';
import { dataAddNewTransaction } from '../redux/data';
import { rapsAddOrUpdate, rapsLoadState } from '../redux/raps';
import { uniswapUpdateAllowances } from '../redux/uniswap';
import { contractUtils, gasUtils } from '../utils';

const handleUnlockIfNeeded = async (assetToUnlock, currentRap, wallet) => {
  console.log('handle unlock if needed', assetToUnlock);
  const { accountAddress } = store.getState().settings;
  const needsUnlocking = await assetNeedsUnlocking(
    accountAddress,
    assetToUnlock
  );
  console.log('does this thing need unlocking?', needsUnlocking);
  if (!needsUnlocking) return;

  const { dispatch } = store;
  const { gasPrices } = store.getState().gas;
  const { address: assetAddress, exchangeAddress } = assetToUnlock;
  const fastGasPrice = get(gasPrices, `[${gasUtils.FAST}]`);
  console.log('probs not');
  const gasLimit = await contractUtils.estimateApprove(
    assetAddress,
    exchangeAddress
  );

  currentRap.transactions.approval = { confirmed: null, hash: null };
  console.log('Adding approval to rap', currentRap);
  dispatch(rapsAddOrUpdate(currentRap.id, currentRap));

  const { approval } = await contractUtils.approve(
    assetAddress,
    exchangeAddress,
    gasLimit,
    get(fastGasPrice, 'value.amount'),
    wallet
  );

  currentRap.transactions.approval = approval.hash;
  console.log('adding a new txn for the approval', approval.hash);
  dispatch(
    dataAddNewTransaction({
      amount: 0,
      asset: assetToUnlock,
      from: wallet.address,
      hash: approval.hash,
      nonce: get(approval, 'nonce'),
      to: get(approval, 'to'),
    })
  );
  dispatch(rapsAddOrUpdate(currentRap.id, currentRap));

  console.log('APPROVAL SUBMITTED, HASH', approval.hash);
  console.log('WAITING TO BE MINED...');
  await approval.wait(); // TODO JIN
  currentRap.transactions.approval.confirmed = true;
  dispatch(rapsAddOrUpdate(currentRap.id, currentRap));
  console.log('APPROVAL READY, LETS GOOO');
};

const assetNeedsUnlocking = async (accountAddress, currency) => {
  const { address, exchangeAddress } = currency;
  console.log('asset needs unlocking check, should be lowered', address);
  const { allowances } = store.getState().uniswap;
  const isInputEth = address === 'eth';
  if (isInputEth) {
    return false;
  }
  let allowance = allowances[toLower(address)];
  if (greaterThan(allowance, 0)) return false;
  allowance = await contractUtils.getAllowance(
    accountAddress,
    currency,
    exchangeAddress
  );
  const { dispatch } = store;
  dispatch(uniswapUpdateAllowances({ [toLower(address)]: allowance }));
  return !greaterThan(allowance, 0);
};

const createNewRap = (
  inputAmount,
  inputAsExactAmount,
  inputCurrency,
  outputAmount,
  outputCurrency,
  selectedGasPrice
) => {
  const { dispatch } = store;
  const now = new Date().getTime();
  const currentRap = {
    completed_at: null,
    id: `rap_${now}`,
    parameters: {
      inputAmount,
      inputAsExactAmount,
      inputCurrency,
      outputAmount,
      outputCurrency,
      selectedGasPrice,
    },
    started_at: now,
    transactions: {
      swap: { confirmed: null, hash: null },
    },
    type: 'swap-uniswap',
  };

  console.log('Storing new rap', currentRap);
  dispatch(rapsAddOrUpdate(currentRap.id, currentRap));
  return currentRap;
};

/**
 * @desc Swap two assets on Uniswap
 * @param  {String} fromAsset,
 * @param  {String} toAsset,
 * @param  {Object} inputAmount,
 * @param  {Object} outputAmount,
 * @param  {Object} gas,
 * @return {Promise}
 */
const swapOnUniswap = async (
  wallet,
  inputCurrency,
  outputCurrency,
  inputAmount,
  outputAmount,
  selectedGasPrice = null,
  inputAsExactAmount,
  rap = null
) => {
  console.log('swap on uniswap!');
  let currentRap = rap;
  const { dispatch } = store;
  const { gasPrices } = store.getState().gas;
  const { accountAddress, chainId } = store.getState().settings;
  const { inputReserve, outputReserve } = store.getState().uniswap;
  // It's a new rap, simple unlock(?) & swap
  if (currentRap === null) {
    console.log('new rap!');
    currentRap = createNewRap(
      inputAmount,
      inputAsExactAmount,
      inputCurrency,
      outputAmount,
      outputCurrency,
      selectedGasPrice
    );
  } else {
    // It's part of a bigger rap, let's load it
    console.log('loading a rap');
    const raps = await dispatch(rapsLoadState());
    currentRap = raps[rap];
  }

  // TODO JIN raps should accept a callback after data add new txns if not already called
  // TODO JIN should I use existing trade details if not unlocked?
  await handleUnlockIfNeeded(inputCurrency, currentRap, wallet);

  console.log('calculating trade details');

  //  2 - Swap
  // 2.1 - Get Trade Details
  const tradeDetails = calculateTradeDetails(
    chainId,
    inputAmount,
    inputCurrency,
    inputReserve,
    outputAmount,
    outputCurrency,
    outputReserve,
    inputAsExactAmount
  );

  // 2.2 - Execute Swap

  console.log('execute the swap');
  let gasPrice = get(selectedGasPrice, 'value.amount');
  if (!gasPrice) {
    gasPrice = get(gasPrices, `[${gasUtils.FAST}].value.amount`);
  }
  const gasLimit = await estimateSwapGasLimit(accountAddress, tradeDetails);

  console.log('About to execute swap with', {
    gasLimit,
    gasPrice,
    tradeDetails,
    wallet,
  });

  const swap = await executeSwap(tradeDetails, gasLimit, gasPrice, wallet);
  currentRap.transactions.swap.hash = swap.hash;
  console.log('adding a new swap txn to pending', swap.hash);
  dispatch(
    dataAddNewTransaction({
      amount: inputAmount,
      asset: inputCurrency,
      from: accountAddress,
      hash: swap.hash,
      nonce: get(swap, 'nonce'),
      to: get(swap, 'to'),
    })
  );
  dispatch(rapsAddOrUpdate(currentRap.id, currentRap));
  return { rap: currentRap, swap };
};

export default swapOnUniswap;
