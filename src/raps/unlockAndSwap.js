import { concat, get, reduce, toLower } from 'lodash';
import {
  calculateTradeDetails,
  estimateSwapGasLimit,
} from '../handlers/uniswap';
import { add } from '../helpers/utilities';
import { rapsAddOrUpdate } from '../redux/raps';
import store from '../redux/store';
import { ethUnits } from '../references';
import { contractUtils } from '../utils';
import { isValidSwapInput } from './actions/swap';
import { assetNeedsUnlocking } from './actions/unlock';
import { createNewAction, createNewRap, RapActionTypes } from './common';

export const estimateUnlockAndSwap = async ({
  inputAmount,
  inputCurrency,
  inputReserve,
  outputAmount,
  outputCurrency,
  outputReserve,
}) => {
  if (!inputAmount) inputAmount = 1;
  if (!outputAmount) outputAmount = 1;

  const isValid = isValidSwapInput({
    inputCurrency,
    inputReserve,
    outputCurrency,
    outputReserve,
  });

  if (!isValid) return ethUnits.basic_swap;

  const { accountAddress, chainId } = store.getState().settings;
  const { pairs, allTokens } = store.getState().uniswap;
  const globalPairs = {
    ...pairs,
    ...allTokens,
  };
  const exchangeAddress = get(
    globalPairs,
    `[${toLower(inputCurrency.address)}].exchangeAddress`
  );

  let gasLimits = [];
  const swapAssetNeedsUnlocking = await assetNeedsUnlocking(
    accountAddress,
    inputAmount,
    inputCurrency,
    exchangeAddress
  );
  if (swapAssetNeedsUnlocking) {
    const unlockGasLimit = await contractUtils.estimateApprove(
      inputCurrency.address,
      exchangeAddress
    );
    gasLimits = concat(gasLimits, unlockGasLimit);
  }

  const tradeDetails = calculateTradeDetails(
    chainId,
    inputAmount,
    inputCurrency,
    inputReserve,
    outputAmount,
    outputCurrency,
    outputReserve,
    true
  );
  const swapGasLimit = await estimateSwapGasLimit(accountAddress, tradeDetails);
  gasLimits = concat(gasLimits, swapGasLimit);

  return reduce(gasLimits, (acc, limit) => add(acc, limit), '0');
};

const createUnlockAndSwapRap = async ({
  callback,
  inputAmount,
  inputAsExactAmount,
  inputCurrency,
  inputReserve,
  outputAmount,
  outputCurrency,
  outputReserve,
  selectedGasPrice,
}) => {
  // create unlock rap
  const { accountAddress, chainId } = store.getState().settings;
  const { pairs, allTokens } = store.getState().uniswap;
  const globalPairs = {
    ...pairs,
    ...allTokens,
  };
  const exchangeAddress = get(
    globalPairs,
    `[${toLower(inputCurrency.address)}].exchangeAddress`
  );

  let actions = [];

  const swapAssetNeedsUnlocking = await assetNeedsUnlocking(
    accountAddress,
    inputAmount,
    inputCurrency,
    exchangeAddress
  );

  if (swapAssetNeedsUnlocking) {
    const unlock = createNewAction(RapActionTypes.unlock, {
      accountAddress,
      amount: inputAmount,
      assetToUnlock: inputCurrency,
      contractAddress: exchangeAddress,
    });
    actions = concat(actions, unlock);
  }

  // create a swap rap
  const swap = createNewAction(RapActionTypes.swap, {
    accountAddress,
    chainId,
    inputAmount,
    inputAsExactAmount,
    inputCurrency,
    inputReserve,
    outputAmount,
    outputCurrency,
    outputReserve,
    selectedGasPrice,
  });
  actions = concat(actions, swap);

  // create the overall rap
  const newRap = createNewRap(actions, callback);

  // update the rap store
  const { dispatch } = store;
  dispatch(rapsAddOrUpdate(newRap.id, newRap));
  return newRap;
};

export default createUnlockAndSwapRap;
