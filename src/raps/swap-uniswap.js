import { get, toLower } from 'lodash';
import {
  calculateTradeDetails,
  executeSwap,
  estimateSwapGasLimit,
} from '../handlers/uniswap';
import { greaterThan } from '../helpers/utilities';
import store from '../redux/store';
import { contractUtils, gasUtils } from '../utils';
import { rapsAddOrUpdate, rapsLoadState } from '../redux/raps';
import {
  uniswapUpdateAllowances,
  uniswapUpdateInputCurrency,
  uniswapUpdateOutputCurrency,
} from '../redux/uniswap';
import { web3UpdateReserves } from '../redux/web3listener';

const handleUnlockIfNeeded = async (assetToUnlock, currentRap, wallet) => {
  const needsUnlocking = assetNeedsUnlocking(wallet.address, assetToUnlock);
  if (!needsUnlocking) return;

  const { dispatch } = store;
  const { gasPrices } = store.getState().gas;
  const { address: assetAddress, exchangeAddress } = assetToUnlock;
  const fastGasPrice = get(gasPrices, `[${gasUtils.FAST}]`);
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
  const { allowances } = store.getState().uniswap;
  const isInputEth = address === 'eth';
  if (isInputEth) {
    return false;
  }
  let allowance = allowances[address];
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
  let currentRap = rap;
  const { dispatch } = store;
  const { gasPrices } = store.getState().gas;
  // It's a new rap, simple unlock(?) & swap
  if (currentRap === null) {
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
    const raps = await dispatch(rapsLoadState());
    currentRap = raps[rap]; // TODO JIN is this rap ID?
  }

  await dispatch(uniswapUpdateInputCurrency(inputCurrency)); // TODO JIN not needed?
  await dispatch(uniswapUpdateOutputCurrency(outputCurrency)); // TODO JIN not needed?
  const { inputReserve, outputReserve } = await dispatch(web3UpdateReserves()); // TODO JIN not needed

  // TODO JIN should be adding pending txns
  await handleUnlockIfNeeded(inputCurrency, currentRap, wallet);

  //  2 - Swap
  // 2.1 - Get Trade Details
  const chainId = get(wallet, 'provider.chainId');
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

  let gasPrice = get(selectedGasPrice, 'value.amount');
  if (!gasPrice) {
    gasPrice = get(gasPrices, `[${gasUtils.FAST}]`);
  }
  const gasLimit = await estimateSwapGasLimit(wallet.address, tradeDetails);

  console.log('About to execute swap with', {
    gasLimit,
    gasPrice,
    tradeDetails,
    wallet,
  });

  const swap = await executeSwap(tradeDetails, gasLimit, gasPrice, wallet);
  currentRap.transactions.swap.hash = swap.hash;
  dispatch(rapsAddOrUpdate(currentRap.id, currentRap));
  return { rap: currentRap, swap };
};

export default swapOnUniswap;
