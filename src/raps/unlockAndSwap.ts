import { getTargetAddress, isAllowedTargetContract } from '@rainbow-me/swaps';
import { Address } from 'viem';
import { createNewAction, createNewRap } from './common';
import { RapAction, RapSwapActionParameters, RapUnlockActionParameters } from './references';

export const createUnlockAndSwapRap = async (swapParameters: RapSwapActionParameters<'swap'>) => {
  let actions: RapAction<'swap' | 'unlock'>[] = [];

  const { sellAmount, quote, chainId, assetToSell, assetToBuy } = swapParameters;
  const { allowanceNeeded } = quote;
  const targetAddress = getTargetAddress(quote);
  const accountAddress = quote.from as Address;

  if (allowanceNeeded) {
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
    requiresApprove: allowanceNeeded,
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
