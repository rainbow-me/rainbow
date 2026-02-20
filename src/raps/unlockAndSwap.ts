import { getTargetAddress, isAllowedTargetContract } from '@rainbow-me/swaps';
import { type Address } from 'viem';
import { assetNeedsUnlocking } from './actions';
import { createNewAction, createNewRap } from './common';
import { type RapAction, type RapSwapActionParameters, type RapUnlockActionParameters } from './references';

export const createUnlockAndSwapRap = async (swapParameters: RapSwapActionParameters<'swap'>) => {
  let actions: RapAction<'swap' | 'unlock'>[] = [];

  const { sellAmount, quote, chainId, assetToSell, assetToBuy } = swapParameters;
  const targetAddress = getTargetAddress(quote);

  const { from: accountAddress, allowanceNeeded } = quote;

  let swapAssetNeedsUnlocking = false;

  if (allowanceNeeded) {
    swapAssetNeedsUnlocking = await assetNeedsUnlocking({
      owner: accountAddress as Address,
      amount: sellAmount,
      assetToUnlock: assetToSell,
      spender: targetAddress as Address,
      chainId,
    });
  }

  if (swapAssetNeedsUnlocking) {
    if (!targetAddress) {
      throw new Error('Target address not found');
    }
    const isAllowedTarget = isAllowedTargetContract(targetAddress, chainId as number);
    if (!isAllowedTarget) {
      throw new Error('Target address not allowed');
    }
    const unlock = createNewAction('unlock', {
      fromAddress: accountAddress,
      amount: sellAmount,
      assetToUnlock: assetToSell,
      chainId,
      contractAddress: targetAddress,
    } as RapUnlockActionParameters);
    actions = actions.concat(unlock);
  }

  // create a swap rap
  const swap = createNewAction('swap', {
    chainId,
    sellAmount,
    permit: false,
    requiresApprove: swapAssetNeedsUnlocking,
    quote,
    meta: swapParameters.meta,
    assetToSell,
    assetToBuy,
    gasParams: swapParameters.gasParams,
    gasFeeParamsBySpeed: swapParameters.gasFeeParamsBySpeed,
  } satisfies RapSwapActionParameters<'swap'>);
  actions = actions.concat(swap);

  // create the overall rap
  const newRap = createNewRap(actions);
  return newRap;
};
