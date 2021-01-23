import { concat, reduce } from 'lodash';
import { assetNeedsUnlocking, isValidSwapInput } from './actions';
import { createNewAction, createNewRap, RapActionTypes } from './common';
import { estimateSwapGasLimit } from '@rainbow-me/handlers/uniswap';
import { rapsAddOrUpdate } from '@rainbow-me/redux/raps';
import store from '@rainbow-me/redux/store';
import { ethUnits, UNISWAP_V2_ROUTER_ADDRESS } from '@rainbow-me/references';
import { add } from '@rainbow-me/utilities';
import { contractUtils } from '@rainbow-me/utils';

export const estimateUnlockAndSwap = async ({
  inputAmount,
  inputCurrency,
  outputAmount,
  outputCurrency,
  tradeDetails,
}) => {
  if (!inputAmount) inputAmount = 1;
  if (!outputAmount) outputAmount = 1;

  const isValid = isValidSwapInput({
    inputCurrency,
    outputCurrency,
  });

  if (!isValid) return ethUnits.basic_swap;

  const { accountAddress, chainId } = store.getState().settings;

  let gasLimits = [];
  const swapAssetNeedsUnlocking = await assetNeedsUnlocking(
    accountAddress,
    inputAmount,
    inputCurrency,
    UNISWAP_V2_ROUTER_ADDRESS
  );
  if (swapAssetNeedsUnlocking) {
    const unlockGasLimit = await contractUtils.estimateApprove(
      accountAddress,
      inputCurrency.address,
      UNISWAP_V2_ROUTER_ADDRESS
    );
    gasLimits = concat(gasLimits, unlockGasLimit, ethUnits.basic_swap);
  } else {
    const { gasLimit: swapGasLimit } = await estimateSwapGasLimit({
      accountAddress,
      chainId,
      inputCurrency,
      outputCurrency,
      tradeDetails,
    });
    gasLimits = concat(gasLimits, swapGasLimit);
  }

  return reduce(gasLimits, (acc, limit) => add(acc, limit), '0');
};

export const createUnlockAndSwapRap = async ({
  callback,
  inputAmount,
  inputCurrency,
  outputCurrency,
  selectedGasPrice,
  tradeDetails,
}) => {
  // create unlock rap
  const { accountAddress } = store.getState().settings;

  let actions = [];

  const swapAssetNeedsUnlocking = await assetNeedsUnlocking(
    accountAddress,
    inputAmount,
    inputCurrency,
    UNISWAP_V2_ROUTER_ADDRESS
  );

  if (swapAssetNeedsUnlocking) {
    const unlock = createNewAction(RapActionTypes.unlock, {
      accountAddress,
      amount: inputAmount,
      assetToUnlock: inputCurrency,
      contractAddress: UNISWAP_V2_ROUTER_ADDRESS,
      selectedGasPrice,
    });
    actions = concat(actions, unlock);
  }

  // create a swap rap
  const swap = createNewAction(RapActionTypes.swap, {
    accountAddress,
    inputAmount,
    inputCurrency,
    outputCurrency,
    selectedGasPrice,
    tradeDetails,
  });
  actions = concat(actions, swap);

  // create the overall rap
  const newRap = createNewRap(actions, callback);

  // update the rap store
  const { dispatch } = store;
  dispatch(rapsAddOrUpdate(newRap.id, newRap));
  return newRap;
};
