import { concat, reduce, toLower } from 'lodash';
import { assetNeedsUnlocking, estimateApprove } from './actions';
import {
  createNewAction,
  createNewRap,
  RapAction,
  RapActionTypes,
  SwapActionParameters,
} from './common';
import { estimateSwapGasLimit } from '@rainbow-me/handlers/uniswap';
import store from '@rainbow-me/redux/store';
import { ethUnits, ETH_ADDRESS } from '@rainbow-me/references';
import { add } from '@rainbow-me/utilities';
import { ALLOWS_PERMIT, PermitSupportedTokenList, RAINBOW_ROUTER_CONTRACT_ADDRESS, WETH } from 'rainbow-swaps';

export const estimateUnlockAndSwap = async (
  swapParameters: SwapActionParameters
) => {
  const { inputAmount, tradeDetails } = swapParameters;
  const { inputCurrency, outputCurrency } = store.getState().swap;

  if (!inputCurrency || !outputCurrency || !inputAmount)
    return ethUnits.basic_swap;

  const { accountAddress, chainId } = store.getState().settings;

  const isWethUnwrapping = toLower(inputCurrency.address) === toLower(WETH['1']) && toLower(outputCurrency.address) === toLower(ETH_ADDRESS);

  let gasLimits: (string | number)[] = [];
  let swapAssetNeedsUnlocking = false;
  if(!isWethUnwrapping){
    swapAssetNeedsUnlocking = await assetNeedsUnlocking(
      accountAddress,
      inputAmount,
      inputCurrency,
      RAINBOW_ROUTER_CONTRACT_ADDRESS
    );
  }

  if (swapAssetNeedsUnlocking) {
    const unlockGasLimit = await estimateApprove(
      accountAddress,
      inputCurrency.address,
      RAINBOW_ROUTER_CONTRACT_ADDRESS
    );
    gasLimits = concat(gasLimits, unlockGasLimit, ethUnits.basic_swap);
  } else {
    const swapGasLimit = await estimateSwapGasLimit({
      chainId,
      requiresApprove: swapAssetNeedsUnlocking,
      tradeDetails,
    });

    gasLimits = concat(gasLimits, swapGasLimit);
  }

  return reduce(gasLimits, (acc, limit) => add(acc, limit), '0');
};

export const createUnlockAndSwapRap = async (
  swapParameters: SwapActionParameters
) => {
  let actions: RapAction[] = [];

  const { inputAmount, tradeDetails } = swapParameters;
  const { inputCurrency, outputCurrency } = store.getState().swap;

  if (!inputCurrency || !outputCurrency || !inputAmount)
    return ethUnits.basic_swap;

  const { accountAddress, chainId } = store.getState().settings;
  const isWethUnwrapping = toLower(inputCurrency.address) === toLower(WETH['1']) && toLower(outputCurrency.address) === toLower(ETH_ADDRESS);
  
  let swapAssetNeedsUnlocking = false;

  if(!isWethUnwrapping){
    swapAssetNeedsUnlocking = await assetNeedsUnlocking(
      accountAddress,
      inputAmount,
      inputCurrency,
      RAINBOW_ROUTER_CONTRACT_ADDRESS
    );
  }
  const allowsPermit = ALLOWS_PERMIT[toLower(inputCurrency.address) as keyof PermitSupportedTokenList];

  if (swapAssetNeedsUnlocking && !allowsPermit) {
    const unlock = createNewAction(RapActionTypes.unlock, {
      amount: inputAmount,
      assetToUnlock: inputCurrency,
      contractAddress: RAINBOW_ROUTER_CONTRACT_ADDRESS,
    });
    actions = concat(actions, unlock);
  }

  // create a swap rap
  const swap = createNewAction(RapActionTypes.swap, {
    inputAmount,
    tradeDetails,
    permit: swapAssetNeedsUnlocking && allowsPermit
  });
  actions = concat(actions, swap);

  // create the overall rap
  const newRap = createNewRap(actions);
  return newRap;
};
