import { isAllowedTargetContract } from '@rainbow-me/swaps';

import { resolveApprovalRequirement } from './approval';
import { createNewAction } from './common';
import type { RapSwapActionParameters, SwapRap } from './references';

export const createUnlockAndSwapRap = async (swapParameters: RapSwapActionParameters<'swap'>): Promise<SwapRap<'swap'>> => {
  const { sellAmount, quote, chainId, assetToSell, assetToBuy } = swapParameters;
  const { allowanceTargetAddress, requiresApprove } = await resolveApprovalRequirement({
    quote,
    chainId,
    sellAmount,
  });

  if (allowanceTargetAddress && !isAllowedTargetContract(allowanceTargetAddress, chainId)) {
    throw new Error('Target address not allowed');
  }

  const unlock =
    allowanceTargetAddress && requiresApprove
      ? createNewAction('unlock', {
          fromAddress: quote.from,
          amount: sellAmount,
          assetToUnlock: assetToSell,
          chainId,
          contractAddress: allowanceTargetAddress,
        })
      : null;

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

  return { actions: unlock ? [unlock, swap] : [swap], type: 'swap' };
};
