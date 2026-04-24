import { isAllowedTargetContract } from '@rainbow-me/swaps';

import { resolveApprovalRequirement } from './approval';
import { createNewAction, createNewRap } from './common';
import type { RapAction, RapSwapActionParameters } from './references';

export const createUnlockAndSwapRap = async (swapParameters: RapSwapActionParameters<'swap'>) => {
  let actions: RapAction<'swap' | 'unlock'>[] = [];

  const { sellAmount, quote, chainId, assetToSell, assetToBuy } = swapParameters;
  const { allowanceTargetAddress, requiresApprove } = await resolveApprovalRequirement({
    quote,
    chainId,
    sellAmount,
  });

  if (allowanceTargetAddress) {
    const isAllowedTarget = isAllowedTargetContract(allowanceTargetAddress, chainId);
    if (!isAllowedTarget) {
      throw new Error('Target address not allowed');
    }

    if (requiresApprove) {
      const unlock = createNewAction('unlock', {
        fromAddress: quote.from,
        amount: sellAmount,
        assetToUnlock: assetToSell,
        chainId,
        contractAddress: allowanceTargetAddress,
      });
      actions = actions.concat(unlock);
    }
  }

  // create a swap rap
  const swap = createNewAction('swap', {
    chainId,
    sellAmount,
    permit: false,
    requiresApprove,
    nonce: swapParameters.nonce,
    quote,
    meta: swapParameters.meta,
    assetToSell,
    assetToBuy,
    gasParams: swapParameters.gasParams,
    gasFeeParamsBySpeed: swapParameters.gasFeeParamsBySpeed,
  });
  actions = actions.concat(swap);

  // create the overall rap
  const newRap = createNewRap(actions);
  return newRap;
};
